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

    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? Deno.env.get('REACT_APP_SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('REACT_APP_SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Usuario no autenticado')
    }

    const { 
      unitId, 
      months, 
      paymentType,
      insurance, 
      insurancePrice,
      insuranceCoverage,
      unitPrice, 
      totalPrice,
      unitSize 
    } = await req.json()

    // Validar que la unidad esté disponible
    const { data: unit, error: unitError } = await supabaseClient
      .from('storage_units')
      .select('*')
      .eq('id', unitId)
      .eq('status', 'available')
      .single()

    if (unitError || !unit) {
      throw new Error('Unidad no disponible')
    }

    // Crear los line items para Stripe basados en el tipo de pago
    const lineItems: any[] = []
    
    if (paymentType === 'subscription') {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Unidad de almacenamiento ${unitSize}m²`,
            description: `Alquiler mensual de trastero ${unitSize}m²`,
          },
          unit_amount: Math.round(unitPrice * 100), // Stripe usa centavos
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      })

      // Agregar seguro si se seleccionó (también recurrente)
      if (insurance && insurancePrice > 0) {
        const formatPrice = (amount: number) => `€${amount.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        
        lineItems.push({
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Seguro de contenido',
              description: `Cobertura hasta ${formatPrice(insuranceCoverage || 0)} contra daños, robos e incendios`,
            },
            unit_amount: Math.round(insurancePrice * 100),
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        })
      }
    } 

    const sessionConfig: any = {
      customer_email: user.email,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: paymentType === 'subscription' ? 'subscription' : 'payment',
      success_url: `${req.headers.get('origin')}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/dashboard?wizard=true&step=summary&canceled=true`,
      metadata: {
        userId: user.id,
        unitId: unitId.toString(),
        months: months.toString(),
        paymentType: paymentType,
        insurance: insurance.toString(),
        insurancePrice: (insurancePrice || 0).toString(),
        insuranceCoverage: insuranceCoverage.toString(),
        unitSize: unitSize.toString(),
        unitPrice: (unitPrice || 0).toString(),
        totalPrice: totalPrice.toString(),
      },
    }

    // For subscriptions, allow payment method collection for future payments
    if (paymentType === 'subscription') {
      sessionConfig.payment_method_collection = 'always'
      // No trial period needed - Stripe will charge immediately by default for new subscriptions
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})