import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

const mpConfig = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 10000 },
})

export const preferenceClient = new Preference(mpConfig)
export const paymentClient = new Payment(mpConfig)
