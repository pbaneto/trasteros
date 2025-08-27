import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BaseRequestBody {
  phoneNumber: string
  messageType: 'verification' | 'rental_confirmation' | 'cancellation_notice'
}

interface VerificationRequestBody extends BaseRequestBody {
  messageType: 'verification'
}

interface RentalConfirmationRequestBody extends BaseRequestBody {
  messageType: 'rental_confirmation'
  storageUnitNumber: string
  accessCode: string
  rentalStartDate: string
}

interface CancellationNoticeRequestBody extends BaseRequestBody {
  messageType: 'cancellation_notice'
  storageUnitNumber: string
  evacuationDeadline: string
}

type RequestBody = VerificationRequestBody | RentalConfirmationRequestBody | CancellationNoticeRequestBody

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requestBody: RequestBody = await req.json()
    const { phoneNumber, messageType } = requestBody

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!messageType) {
      return new Response(
        JSON.stringify({ error: 'Message type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate message content based on type
    let messageBody: string
    let verificationCode: string | null = null

    switch (messageType) {
      case 'verification':
        verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
        messageBody = `Tu código de verificación de Trasteros es: ${verificationCode}. Este código expira en 10 minutos.`
        break
      
      case 'rental_confirmation':
        const rentalData = requestBody as RentalConfirmationRequestBody
        if (!rentalData.storageUnitNumber || !rentalData.accessCode || !rentalData.rentalStartDate) {
          return new Response(
            JSON.stringify({ error: 'Storage unit number, access code, and rental start date are required for rental confirmation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        messageBody = `¡Bienvenido a Trasteros! 🎉\n\nTu trastero ${rentalData.storageUnitNumber} está listo desde el ${new Date(rentalData.rentalStartDate).toLocaleDateString('es-ES')}.\n\n🔑 Tu código de acceso es: ${rentalData.accessCode}\n\nGuarda este código de forma segura. Lo necesitarás para acceder a tu trastero.\n\n¡Gracias por confiar en nosotros!`
        break
      
      case 'cancellation_notice':
        const cancellationData = requestBody as CancellationNoticeRequestBody
        if (!cancellationData.storageUnitNumber || !cancellationData.evacuationDeadline) {
          return new Response(
            JSON.stringify({ error: 'Storage unit number and evacuation deadline are required for cancellation notice' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        messageBody = `Hemos recibido tu solicitud de cancelación del trastero ${cancellationData.storageUnitNumber}.\n\n⏰ Fecha límite para vaciar: ${new Date(cancellationData.evacuationDeadline).toLocaleDateString('es-ES')}\n\nPor favor, retira todas tus pertenencias antes de esta fecha. Después del plazo, el trastero se considerará abandonado.\n\nGracias por haber confiado en Trasteros.`
        break
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid message type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER')

    if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
      return new Response(
        JSON.stringify({ error: 'Twilio configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
    const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`)

    console.log('From:', `whatsapp:${twilioWhatsAppNumber}`)
    console.log('To:', `whatsapp:${phoneNumber}`)
    console.log('twilioUrl', twilioUrl)
    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: `whatsapp:${twilioWhatsAppNumber}`,
        To: `whatsapp:${phoneNumber}`,
        Body: messageBody,
      }),
    })

    if (!twilioResponse.ok) {
      const error = await twilioResponse.text()
      console.error('Twilio error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send WhatsApp message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Only update user profile for verification messages
    if (messageType === 'verification' && verificationCode) {
      await supabaseClient
        .from('users_profile')
        .update({
          phone_number: phoneNumber,
          verification_code: verificationCode,
          verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        })
        .eq('id', user.id)
    }

    const successMessages = {
      verification: 'Verification code sent successfully',
      rental_confirmation: 'Rental confirmation sent successfully',
      cancellation_notice: 'Cancellation notice sent successfully'
    }

    return new Response(
      JSON.stringify({ success: true, message: successMessages[messageType] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})