import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Use service role key for webhook access  
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    let event: Stripe.Event

    try {
      if (!signature || !webhookSecret) {
        throw new Error('Missing stripe signature or webhook secret')
      }

      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`)
      return new Response(`Webhook signature verification failed: ${error.message}`, {
        status: 400,
      })
    }

    console.log(`Processing event: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (!session.metadata) {
          throw new Error('No metadata in session')
        }
        console.log('Session metadata:', session.metadata)

        const { userId, unitId, months, paymentType, insurance, insurancePrice, insuranceCoverage, unitSize, unitPrice, totalPrice } = session.metadata
        
        // Validate required metadata (test events may not have proper metadata)
        if (!userId || !unitId) {
          console.log('Missing required metadata, skipping test event')
          break
        }
        
        const currentPaymentType = paymentType || 'single' // Default to single for backwards compatibility
        console.log('Processing payment type:', currentPaymentType)
        
        if (currentPaymentType === 'subscription') {
          // For subscriptions, create rental and payment immediately
          console.log('Processing subscription checkout')
          
          if (!session.subscription) {
            console.error('Subscription checkout session missing subscription ID:', {
              sessionId: session.id,
              mode: session.mode,
              paymentStatus: session.payment_status
            })
            throw new Error('Subscription ID missing from checkout session')
          }
          
          // Handle subscription ID properly
          const subscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id
          
          console.log('Creating subscription rental with subscription ID:', subscriptionId)
          
          // Generate 4-digit access code
          const accessCode = Math.floor(1000 + Math.random() * 9000).toString()
          
          const startDate = new Date()
          const endDate = new Date()
          endDate.setMonth(endDate.getMonth() + 1) // Initial 1 month period
          const nextPaymentDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
          
          const rentalData = {
            user_id: userId,
            unit_id: unitId,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            price: parseFloat(unitPrice || '0'),
            insurance_amount: insurance === 'true' ? parseFloat(insurancePrice || '0') : 0,
            status: 'active',
            ttlock_code: accessCode,
            stripe_payment_intent_id: null, // Subscriptions don't have payment intent at checkout
            months_paid: 1,
            payment_type: currentPaymentType,
            subscription_status: 'active',
            next_payment_date: nextPaymentDate.toISOString().split('T')[0],
            stripe_subscription_id: subscriptionId,
            checkout_session_id: session.id,
            subscription_metadata: session.metadata,
          }
          
          // Create rental record
          const { data: rental, error: rentalError } = await supabaseClient
            .from('rentals')
            .insert([rentalData])
            .select()
            .single()

          if (rentalError) {
            console.error('Error creating rental:', rentalError)
            throw rentalError
          }

          console.log(`Subscription rental ${rental.id} created in active status`)

          // Create initial payment record for subscription with detailed payment info
          const { error: paymentError } = await supabaseClient
            .from('payments')
            .insert([{
              rental_id: rental.id,
              stripe_payment_intent_id: null, // No payment intent for subscription checkout
              status: 'succeeded',
              payment_date: new Date().toISOString(),
              payment_method: 'card',
              payment_type: 'subscription',
              subscription_id: subscriptionId,
              billing_cycle_start: rentalData.start_date,
              billing_cycle_end: rentalData.end_date,
              is_subscription_active: true,
              next_billing_date: nextPaymentDate.toISOString().split('T')[0],
              // Payment details
              months_paid: 1, // Subscription pays for 1 month at a time
              unit_price: parseFloat(unitPrice || '0'),
              insurance_included: insurance === 'true',
              insurance_price: insurance === 'true' ? parseFloat(insurancePrice || '0') : 0,
              total_amount: parseFloat(totalPrice || '0'),
            }])
          
          if (paymentError) {
            console.error('Error creating payment record:', paymentError)
            throw paymentError
          }

          // Update unit status to occupied
          const { error: unitError } = await supabaseClient
            .from('storage_units')
            .update({ status: 'occupied' })
            .eq('id', unitId)

          if (unitError) {
            console.error('Error updating unit status:', unitError)
            throw unitError
          }

          console.log(`Successfully processed subscription checkout for user ${userId}, unit ${unitId}`)
        }
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment intent succeeded (ignoring):', paymentIntent.id)
        // Intentionally do nothing - wait for checkout.session.completed
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          // Handle both string and object subscription references
          const subscriptionId = typeof invoice.subscription === 'string' 
            ? invoice.subscription 
            : invoice.subscription.id
          
          console.log('Processing subscription renewal for subscription ID:', subscriptionId)
          
          // Find active rental by subscription ID
          const { data: rental, error: rentalError } = await supabaseClient
            .from('rentals')
            .select('*')
            .eq('stripe_subscription_id', subscriptionId)
            .eq('payment_type', 'subscription')
            .eq('subscription_status', 'active')
            .single()
          
          if (rental && !rentalError) {
            // This is a renewal payment - extend the rental period
            console.log(`Processing subscription renewal for rental ${rental.id}`)
            
            // Extend the rental period by one month
            const currentEndDate = new Date(rental.end_date)
            const newEndDate = new Date(currentEndDate)
            newEndDate.setMonth(newEndDate.getMonth() + 1)
            const nextPaymentDate = new Date(newEndDate.getTime() + 30 * 24 * 60 * 60 * 1000)
            
            // Update rental end date, months paid, and next payment date
            const { error: updateRentalError } = await supabaseClient
              .from('rentals')
              .update({
                end_date: newEndDate.toISOString().split('T')[0],
                months_paid: (rental.months_paid || 0) + 1,
                next_payment_date: nextPaymentDate.toISOString().split('T')[0],
              })
              .eq('id', rental.id)

            if (updateRentalError) {
              console.error('Error updating rental for renewal:', updateRentalError)
              throw updateRentalError
            }

            // Create a new payment record for the renewal with detailed payment info
            const { error: paymentError } = await supabaseClient
              .from('payments')
              .insert([{
                rental_id: rental.id,
                stripe_payment_intent_id: invoice.payment_intent as string,
                status: 'succeeded',
                payment_date: new Date().toISOString(),
                payment_method: 'card',
                payment_type: 'subscription',
                subscription_id: subscriptionId,
                billing_cycle_start: currentEndDate.toISOString().split('T')[0],
                billing_cycle_end: newEndDate.toISOString().split('T')[0],
                is_subscription_active: true,
                next_billing_date: nextPaymentDate.toISOString().split('T')[0],
                // Payment details for renewal (1 month)
                months_paid: 1,
                unit_price: rental.price,
                insurance_included: rental.insurance_amount > 0,
                insurance_price: 0, // Insurance is only charged on first payment
                total_amount: (invoice.amount_paid || 0) / 100,
              }])

            if (paymentError) {
              console.error('Error creating renewal payment record:', paymentError)
              throw paymentError
            }

            console.log(`Successfully processed subscription renewal for rental ${rental.id}`)
              
          } else {
            console.log('No active rental found for subscription renewal', {
              subscriptionId,
              invoiceId: invoice.id,
              paymentIntentId: invoice.payment_intent,
              customerId: invoice.customer,
              rentalError: rentalError?.message
            })
          }
        } else {
          console.log('Invoice payment succeeded but no subscription ID found', {
            invoiceId: invoice.id,
            customerId: invoice.customer,
            paymentIntentId: invoice.payment_intent,
            hasSubscription: !!invoice.subscription
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('Subscription cancelled:', subscription.id)
        
        // Find the rental associated with this subscription
        const { data: rental, error: findError } = await supabaseClient
          .from('rentals')
          .select('*')
          .eq('stripe_subscription_id', subscription.id)
          .eq('payment_type', 'subscription')
          .single()
          
        if (rental && !findError) {
          // Update rental subscription status to cancelled
          const { error: updateError } = await supabaseClient
            .from('rentals')
            .update({
              subscription_status: 'cancelled',
              next_payment_date: null,
            })
            .eq('id', rental.id)
            
          if (updateError) {
            console.error('Error updating cancelled subscription:', updateError)
          } else {
            console.log(`Successfully cancelled subscription for rental ${rental.id}`)
          }
        } else {
          console.log('No active rental found for cancelled subscription')
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Invoice payment failed:', invoice.id)
        
        if (invoice.subscription) {
          const subscriptionId = typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription.id
          
          // Find the rental associated with this subscription
          const { data: rental, error: findError } = await supabaseClient
            .from('rentals')
            .select('*')
            .eq('stripe_subscription_id', subscriptionId)
            .eq('payment_type', 'subscription')
            .single()
            
          if (rental && !findError) {
            // Renewal payment failed - mark as past_due
            console.log(`Subscription payment failed for rental ${rental.id} - marking past due`)
            
            const { error: updateError } = await supabaseClient
              .from('rentals')
              .update({
                subscription_status: 'past_due',
              })
              .eq('id', rental.id)
              
            if (updateError) {
              console.error('Error updating failed subscription payment:', updateError)
            } else {
              console.log(`Successfully marked rental ${rental.id} as past due`)
            }
          } else {
            console.log('No rental found for failed payment subscription', {
              subscriptionId,
              invoiceId: invoice.id,
              error: findError?.message
            })
          }
        }
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`Checkout session expired: ${session.id}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`, {
          eventId: event.id,
          created: event.created,
          livemode: event.livemode
        })
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error(`Error processing webhook: ${error.message}`)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})