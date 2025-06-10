export default function ContactMap() {
  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 md:mb-10 text-center text-primary">Locația noastră</h2>
          
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1420.8087662951636!2d26.095414858473892!3d44.510396671099734!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b1ff4770baaaab%3A0x9ea83cf7f69c5ac7!2sCalea%20Bucure%C8%99tilor%20303A1%2C%20Otopeni%20075100!5e0!3m2!1sro!2sro!4v1703087123456!5m2!1sro!2sro"
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
              <strong>Str. Calea Bucureştilor, Nr.303A1, Otopeni, Ilfov</strong>
            </p>
            <p className="text-sm text-gray-500">
              La doar 500 m de Aeroportul Henri Coandă București
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://maps.app.goo.gl/GhoVMNWvst6BamHx5?g_st=aw"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#ff0066] hover:bg-[#e6005c] text-white px-6 py-3 rounded-md transition-all duration-200 font-medium shadow-md hover:shadow-lg"
              >
                📍 Deschide în Google Maps
              </a>
              <a
                href="https://waze.com/ul/hsv8tkpnqe"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#0099ff] hover:bg-[#007acc] text-white px-6 py-3 rounded-md transition-all duration-200 font-medium shadow-md hover:shadow-lg"
              >
                🚗 Deschide în Waze
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
