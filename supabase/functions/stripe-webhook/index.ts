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
    console.log('Webhook received')
    
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

    console.log('Verifying webhook signature')
    
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
        
        console.log('Checkout session completed:', session.id)
        
        if (!session.metadata) {
          throw new Error('No metadata in session')
        }

        const { userId, unitId, months, insurance, insurancePrice } = session.metadata
        
        // Validate required metadata (test events may not have proper metadata)
        if (!userId || !unitId) {
          console.log('Missing required metadata, skipping test event')
          break
        }
        
        // Generate 4-digit access code
        const accessCode = Math.floor(1000 + Math.random() * 9000).toString()
        console.log('Generated access code:', accessCode)
        
        // Calculate rental period
        const startDate = new Date()
        const endDate = new Date()
        const monthsToAdd = parseInt(months) || 1 // Default to 1 month for test events
        endDate.setMonth(endDate.getMonth() + monthsToAdd)
        const rentalData = {
              user_id: userId,
              unit_id: unitId,
              start_date: startDate.toISOString().split('T')[0],
              end_date: endDate.toISOString().split('T')[0],
              price: 45.00,
              insurance_amount: insurance === 'true' ? parseFloat(insurancePrice || '0') : 0,
              status: 'active',
              ttlock_code: accessCode,
              stripe_payment_intent_id: session.payment_intent as string,
            }
        console.log('Rental data:', rentalData)
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

        console.log('Rental created:', rental)

        console.log('Rental created:', rental.id)

        // Create payment record
        const { error: paymentError } = await supabaseClient
          .from('payments')
          .insert([
            {
              rental_id: rental.id,
              stripe_payment_intent_id: session.payment_intent as string,
              amount: (session.amount_total || 0) / 100, // Convert from cents
              status: 'succeeded',
              payment_date: new Date().toISOString(),
              payment_method: 'card',
            },
          ])

        if (paymentError) {
          console.error('Error creating payment record:', paymentError)
          throw paymentError
        }

        console.log('Payment record created')

        // Update unit status to occupied
        const { error: unitError } = await supabaseClient
          .from('storage_units')
          .update({ status: 'occupied' })
          .eq('id', unitId)

        if (unitError) {
          console.error('Error updating unit status:', unitError)
          throw unitError
        }

        console.log(`Successfully processed checkout for user ${userId}, unit ${unitId}`)
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment intent succeeded (ignoring):', paymentIntent.id)
        // Intentionally do nothing - wait for checkout.session.completed
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`Checkout session expired: ${session.id}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
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