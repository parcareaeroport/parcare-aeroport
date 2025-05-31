export default function ContactMap() {
  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">Locația noastră</h2>

          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 overflow-hidden">
            <div className="aspect-video w-full rounded-xl overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2847.6412543329584!2d26.0691!3d44.5675!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b201908b2c888b%3A0x5e8af4f9a0f35ea!2sHenri%20Coand%C4%83%20International%20Airport!5e0!3m2!1sen!2sro!4v1621436321000!5m2!1sen!2sro"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Locația parcării"
                className="w-full h-full"
              ></iframe>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Ne găsiți la doar 500m de Aeroportul Internațional Henri Coandă (Otopeni), cu acces direct din DN1.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
