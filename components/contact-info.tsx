import Link from "next/link"
import { Phone, Mail, MapPin, Instagram, Facebook, Youtube, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ContactInfo() {
  const contactCards = [
    {
      title: "Sună acum",
      icon: Phone,
      items: [
        // Text items removed as per request
      ],
      actions: [
        { label: "Sună acum", href: "tel:+40734292818", icon: Phone, ariaLabel: "Sună acum" },
        {
          label: "WhatsApp",
          href: "https://wa.me/40734292818",
          icon: MessageSquare,
          ariaLabel: "Trimite mesaj pe WhatsApp",
          target: "_blank",
        },
      ],
    },
    {
      title: "Trimite mesaj",
      icon: Mail,
      items: [
        // Text item removed as per request
      ],
      action: {
        label: "Trimite email",
        href: "mailto:contact.parcareaeroport@gmail.com",
        icon: Mail,
        ariaLabel: "Trimite un email",
      },
    },
    {
      title: "Ne găsești",
      icon: MapPin,
      items: [
        { value: "Strada Aeroportului nr. 10, Otopeni" },
        { value: "Jud. Ilfov, România" },
        { label: "Program de lucru:", value: "NON STOP" },
      ],
      action: {
        label: "Vezi pe hartă",
        href: "https://www.google.com/maps?q=Aeroportul+Otopeni",
        icon: MapPin,
        ariaLabel: "Vezi pe Google Maps",
      },
    },
    {
      title: "Online",
      icon: Instagram,
      items: [], // No text items for this card initially
      socialLinks: [
        { icon: Facebook, href: "https://www.facebook.com/share/1EYNt8Zp19/?mibextid=wwXIfr", label: "Facebook" },
        {
          icon: Instagram,
          href: "https://www.instagram.com/parcare_aeroport?igsh=MXV5d2d2M3NibHh0Yg%3D%3D&utm_source=qr",
          label: "Instagram",
        },
        { icon: Youtube, href: "#", label: "YouTube" }, // Assuming # is a placeholder
      ],
    },
  ]

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactCards.map((card, index) => (
            <div
              key={index}
              className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4 mx-auto">
                <card.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center">{card.title}</h3>

              {card.items && card.items.length > 0 && (
                <div className="space-y-2 mb-4 flex-grow">
                  {card.items.map((item, i) => (
                    <p key={i} className="text-center">
                      {item.label && <span className="font-medium">{item.label} </span>}
                      {item.href ? (
                        <a href={item.href} className="text-primary hover:underline">
                          {item.value}
                        </a>
                      ) : (
                        <span>{item.value}</span>
                      )}
                    </p>
                  ))}
                </div>
              )}

              {/* Spacer to push buttons down if items are few or none */}
              {(!card.items || card.items.length === 0) && !card.socialLinks && <div className="flex-grow"></div>}

              {card.socialLinks && (
                <div className="flex justify-center space-x-4 mt-auto pt-4">
                  {card.socialLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.label}
                      className="bg-primary text-white p-2 rounded-md hover:bg-primary/90 transition-colors"
                    >
                      <link.icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              )}

              {card.actions && card.actions.length > 0 && (
                <div className="mt-auto pt-4 space-y-2">
                  {card.actions.map((action, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="w-full"
                      asChild
                      aria-label={action.ariaLabel}
                    >
                      <Link href={action.href || "#"} target={action.target}>
                        {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                        {action.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              )}
              {card.action &&
                !card.actions && ( // Ensure this doesn't render if card.actions exists
                  <div className="mt-auto pt-4 text-center">
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={card.action.href} aria-label={card.action.ariaLabel}>
                        <card.action.icon className="h-4 w-4 mr-2" />
                        {card.action.label}
                      </Link>
                    </Button>
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
