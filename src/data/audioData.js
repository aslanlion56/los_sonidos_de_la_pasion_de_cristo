// Estructura de datos para los audios principales y secundarios
// Rutas según los archivos en public/audios/ y public/audios/cortos/

export const mainAudios = [
  { id: 1, name: "01- The Olive Garden Night Sky", src: "/audios/01- The Olive Garden Night Sky.mp3" },
  { id: 2, name: "02- Mary Goes To Jesus", src: "/audios/02- Mary Goes To Jesus.mp3" },
  { id: 3, name: "03- Song of Complaint", src: "/audios/03- Song of Complaint.mp3" },
  { id: 4, name: "04- Jesus Arrested", src: "/audios/04- Jesus Arrested.mp3" },
  { id: 5, name: "05- Bearing The Cross", src: "/audios/05- Bearing The Cross.mp3" },
  { id: 6, name: "06- The Stoning", src: "/audios/06- The Stoning.mp3" },
  { id: 7, name: "07- Flagellation Dark Choir Disciples", src: "/audios/07- Flagellation Dark Choir Disciples.mp3" },
  { id: 8, name: "08- Vía Dolorosa", src: "/audios/08- Via Dolorosa.mp3" },
  { id: 9, name: "09- Peaceful But Primitive Procession", src: "/audios/09- Peaceful But Primitive Procession.mp3" },
  { id: 10, name: "10- It Is Done", src: "/audios/10- It Is Done.mp3" },
  { id: 11, name: "11- Peter Denies Jesus", src: "/audios/11- Peter Denies Jesus.mp3" },
  { id: 12, name: "12- Resurrection", src: "/audios/12- Resurrection.mp3" }
];

// Cortos: Puerta y Gallo tienen varias variantes en la misma tarjeta; el resto un solo src.
// Via Dolorosa está solo en principales, no aquí.
export const secondaryAudios = [
  {
    id: 1,
    name: "Puerta",
    icon: "door",
    variants: [
      "/audios/cortos/01- Puerta.mp3",
      "/audios/cortos/01.1- Puerta.mp3"
    ]
  },
  { id: 2, name: "Fogata", icon: "fire", src: "/audios/cortos/02- Fogata.mp3" },
  {
    id: 3,
    name: "Gallo",
    icon: "rooster",
    variants: [
      "/audios/cortos/03- Gallo.mp3",
      "/audios/cortos/03.1- Gallo.mp3",
      "/audios/cortos/03.2- Gallo.mp3"
    ]
  },
  { id: 4, name: "Tormenta", icon: "thunder", src: "/audios/cortos/04- Tormenta.mp3" },
  { id: 5, name: "Tierra temblando", icon: "earthquake", src: "/audios/cortos/05- Tierra temblando.mp3" },
  { id: 6, name: "Tú esta aquí", icon: "music", src: "/audios/cortos/07- Tu esta aqui.mp3" }
];
