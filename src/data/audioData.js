// Estructura de datos para los audios principales y secundarios
// Rutas según los archivos en public/audios/ y public/audios/cortos/

import { publicUrl } from '../utils/publicUrl.js'

export const mainAudios = [
  { id: 1, name: "01- The Olive Garden Night Sky", src: publicUrl('/audios/01- The Olive Garden Night Sky.mp3') },
  { id: 2, name: "02- Mary Goes To Jesus", src: publicUrl('/audios/02- Mary Goes To Jesus.mp3') },
  { id: 3, name: "03- Song of Complaint", src: publicUrl('/audios/03- Song of Complaint.mp3') },
  { id: 4, name: "04- Jesus Arrested", src: publicUrl('/audios/04- Jesus Arrested.mp3') },
  { id: 5, name: "05- Bearing The Cross", src: publicUrl('/audios/05- Bearing The Cross.mp3') },
  { id: 6, name: "06- The Stoning", src: publicUrl('/audios/06- The Stoning.mp3') },
  { id: 7, name: "07- Flagellation Dark Choir Disciples", src: publicUrl('/audios/07- Flagellation Dark Choir Disciples.mp3') },
  { id: 8, name: "08- Vía Dolorosa", src: publicUrl('/audios/08- Via Dolorosa.mp3') },
  { id: 9, name: "09- Peaceful But Primitive Procession", src: publicUrl('/audios/09- Peaceful But Primitive Procession.mp3') },
  { id: 10, name: "10- It Is Done", src: publicUrl('/audios/10- It Is Done.mp3') },
  { id: 11, name: "11- Peter Denies Jesus", src: publicUrl('/audios/11- Peter Denies Jesus.mp3') },
  { id: 12, name: "12- Resurrection", src: publicUrl('/audios/12- Resurrection.mp3') },
]

// Cortos: un solo src por tarjeta. Puerta y Gallo usan solo la variante 1 (01- / 03-); otros MP3 en disco no se borran.
// Via Dolorosa está solo en principales, no aquí.
export const secondaryAudios = [
  {
    id: 1,
    name: 'Puerta',
    icon: 'door',
    src: publicUrl('/audios/cortos/01- Puerta.mp3'),
  },
  { id: 2, name: 'Fogata', icon: 'fire', src: publicUrl('/audios/cortos/02- Fogata.mp3') },
  {
    id: 3,
    name: 'Gallo',
    icon: 'rooster',
    src: publicUrl('/audios/cortos/03- Gallo.mp3'),
  },
  { id: 4, name: 'Tormenta', icon: 'thunder', src: publicUrl('/audios/cortos/04- Tormenta.mp3') },
  { id: 5, name: 'Tierra temblando', icon: 'earthquake', src: publicUrl('/audios/cortos/05- Tierra temblando.mp3') },
  { id: 6, name: 'Tú esta aquí', icon: 'music', src: publicUrl('/audios/cortos/07- Tu esta aqui.mp3') },
]
