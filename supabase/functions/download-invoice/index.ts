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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      })
    }

    const { paymentId } = await req.json()
    console.log('paymentId', paymentId)
    if (!paymentId) {
      return new Response('Payment ID is required', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Get the payment record and verify user owns it
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select(`
        *,
        rental:rentals!inner(
          id,
          user_id
        )
      `)
      .eq('id', paymentId)
      .single()

    console.log('payment', payment, user)

    if (paymentError || !payment) {
      return new Response('Payment not found', { 
        status: 404, 
        headers: corsHeaders 
      })
    }

    // Verify user owns this payment
    if (payment.rental.user_id !== user.id) {
      return new Response('Unauthorized', { 
        status: 403, 
        headers: corsHeaders 
      })
    }

    // For subscription payments, we need to find the invoice
    let invoiceId = payment.stripe_invoice_id

    console.log('payment', payment)
    // If we don't have a stored invoice ID, try to find it via payment intent
    if (!invoiceId && payment.stripe_payment_intent_id) {
      try {
        // Get the payment intent to find the invoice
        const paymentIntent = await stripe.paymentIntents.retrieve(
          payment.stripe_payment_intent_id
        )

        // Search for invoices with this payment intent
        const invoices = await stripe.invoices.list({
          payment_intent: payment.stripe_payment_intent_id,
          limit: 1
        })

        if (invoices.data.length > 0) {
          invoiceId = invoices.data[0].id
          
          // Store the invoice ID for future use
          await supabaseClient
            .from('payments')
            .update({ stripe_invoice_id: invoiceId })
            .eq('id', paymentId)
        }
      } catch (error) {
        console.error('Error finding invoice:', error)
      }
    }

    if (!invoiceId) {
      return new Response(JSON.stringify({
        error: 'No invoice available for this payment'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    try {
      // Get the invoice from Stripe
      const invoice = await stripe.invoices.retrieve(invoiceId)
      
      // Get the invoice PDF URL
      const invoicePdf = invoice.invoice_pdf
      
      if (!invoicePdf) {
        return new Response(JSON.stringify({
          error: 'Invoice PDF not available'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Return the PDF URL for the client to download
      return new Response(JSON.stringify({
        downloadUrl: invoicePdf,
        invoiceNumber: invoice.number,
        invoiceId: invoice.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })

    } catch (stripeError: any) {
      console.error('Stripe error:', stripeError)
      return new Response(JSON.stringify({
        error: 'Failed to retrieve invoice from Stripe',
        details: stripeError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error: any) {
    console.error('Error in download-invoice function:', error)
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})