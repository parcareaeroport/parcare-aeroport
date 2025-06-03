export default function ContactMap() {
  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 md:mb-10 text-center">Locația noastră</h2>
          
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2847.1234567890123!2d26.0851234567890!3d44.5712345678901!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b201234567890a%3A0x123456789abcdef0!2sSoseaua%20Bucuresti-Ploiesti%2C%20Otopeni%2C%20Ilfov!5e0!3m2!1sro!2sro!4v1234567890123!5m2!1sro!2sro"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-lg"
              title="Locația Parcare Aeroport Otopeni"
            ></iframe>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              <strong>Șoseaua București-Ploiești 42A, Otopeni, Ilfov</strong>
            </p>
            <p className="text-sm text-gray-500">
              La doar 2 km de Aeroportul Henri Coandă București
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
