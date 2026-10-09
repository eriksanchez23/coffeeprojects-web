/** Sender of every email the site sends (Payload's Resend adapter and the S21 reply forwarding). */
export function emailFrom(source: Record<string, string | undefined> = process.env) {
  return { address: source.EMAIL_FROM_ADDRESS || 'hola@coffeeprojects.es', name: 'CoffeeProjects' }
}
