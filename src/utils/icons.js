import { 
  FaDoorOpen, 
  FaFire, 
  FaCloudRain, 
  FaWind,
  FaWater,
  FaCrow,
  FaBolt,
  FaCross,
  FaMountain,
  FaMusic
} from 'react-icons/fa'
import { GiRooster } from 'react-icons/gi'

// Mapeo de iconos según el tipo de audio
export const getIconComponent = (iconType) => {
  const iconMap = {
    door: FaDoorOpen,
    rooster: GiRooster,
    fire: FaFire,
    rain: FaCloudRain,
    wind: FaWind,
    waves: FaWater,
    birds: FaCrow,
    thunder: FaBolt,
    cross: FaCross,
    earthquake: FaMountain,
    music: FaMusic
  }

  return iconMap[iconType] || null
}
