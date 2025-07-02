"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Photo {
  id: number
  src: string
  alt: string
  description: string
  aspectRatio: "portrait" | "landscape" | "square"
}

// Generate a larger collection of mountain photos with varied aspect ratios
const mountainPhotos: Photo[] = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    alt: "Mountain Peak at Sunrise",
    description: "Golden hour illuminates the majestic peaks of the Rocky Mountains",
    aspectRatio: "landscape",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1464822759844-d150baec0494?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80",
    alt: "Alpine Lake Reflection",
    description: "Crystal clear alpine lake perfectly mirrors the surrounding peaks",
    aspectRatio: "portrait",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    alt: "Mountain Trail",
    description: "A winding trail leads through wildflower meadows to distant summits",
    aspectRatio: "landscape",
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80",
    alt: "Snow-Capped Peaks",
    description: "Fresh snow dusts the highest peaks in early autumn",
    aspectRatio: "square",
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80",
    alt: "Mountain Valley",
    description: "A peaceful valley nestled between towering mountain walls",
    aspectRatio: "portrait",
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    alt: "Rocky Cliff Face",
    description: "Dramatic cliff faces carved by millennia of natural forces",
    aspectRatio: "landscape",
  },
  {
    id: 7,
    src: "https://images.unsplash.com/photo-1485833077593-4278bba3f11f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80",
    alt: "Mountain Lake Dawn",
    description: "First light breaks over a pristine mountain lake",
    aspectRatio: "portrait",
  },
  {
    id: 8,
    src: "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    alt: "Alpine Meadow",
    description: "Wildflowers carpet the high alpine meadows in summer",
    aspectRatio: "landscape",
  },
  {
    id: 9,
    src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80",
    alt: "Mountain Ridge",
    description: "Jagged ridgelines stretch endlessly into the distance",
    aspectRatio: "square",
  },
  {
    id: 10,
    src: "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80",
    alt: "Glacier Valley",
    description: "Ancient glaciers carved this dramatic valley over millennia",
    aspectRatio: "portrait",
  },
  {
    id: 11,
    src: "https://images.unsplash.com/photo-1464207687429-7505649dae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    alt: "Mountain Storm",
    description: "Storm clouds gather over towering peaks",
    aspectRatio: "landscape",
  },
  {
    id: 12,
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80",
    alt: "Peak Silhouette",
    description: "Mountain silhouettes against a dramatic sky",
    aspectRatio: "square",
  },
  {
    id: 13,
    src: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80",
    alt: "Waterfall Cascade",
    description: "Mountain waterfall cascades down granite cliffs",
    aspectRatio: "portrait",
  },
  {
    id: 14,
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    alt: "Alpine Sunrise",
    description: "The first rays of sun illuminate snow-covered peaks",
    aspectRatio: "landscape",
  },
  {
    id: 15,
    src: "https://images.unsplash.com/photo-1464822759844-d150baec0494?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80",
    alt: "Mountain Reflection",
    description: "Perfect reflections in a still mountain tarn",
    aspectRatio: "portrait",
  },
]

const forestPhotos: Photo[] = [
  {
    id: 16,
    src: "https://images.unsplash.com/photo-1441260038675-7329ab4cc264?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    alt: "Misty Forest Path",
    description: "Morning mist drifts through ancient redwood trees",
    aspectRatio: "landscape",
  },
  {
    id: 17,
    src: "https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80",
    alt: "Autumn Canopy",
    description: "Vibrant fall colors create a natural cathedral overhead",
    aspectRatio: "portrait",
  },
  {
    id: 18,
    src: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80",
    alt: "Forest Stream",
    description: "A gentle stream winds through moss-covered rocks and ferns",
    aspectRatio: "square",
  },
  {
    id: 19,
    src: "https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    alt: "Sunbeams Through Trees",
    description: "Golden sunlight filters through the forest canopy",
    aspectRatio: "landscape",
  },
  {
    id: 20,
    src: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80",
    alt: "Ancient Oak",
    description: "A centuries-old oak tree stands as guardian of the forest",
    aspectRatio: "portrait",
  },
  {
    id: 21,
    src: "https://images.unsplash.com/photo-1574263867128-a3d5c1b1deaa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80",
    alt: "Forest Floor",
    description: "Delicate wildflowers bloom among fallen leaves and moss",
    aspectRatio: "square",
  },
  {
    id: 22,
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80",
    alt: "Towering Pines",
    description: "Ancient pine trees reach toward the sky",
    aspectRatio: "portrait",
  },
  {
    id: 23,
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    alt: "Forest Clearing",
    description: "A peaceful clearing bathed in dappled sunlight",
    aspectRatio: "landscape",
  },
  {
    id: 24,
    src: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80",
    alt: "Moss Covered Rocks",
    description: "Ancient boulders carpeted in emerald moss",
    aspectRatio: "square",
  },
  {
    id: 25,
    src: "https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80",
    alt: "Forest Cathedral",
    description: "Tall trees form natural cathedral arches",
    aspectRatio: "portrait",
  },
  {
    id: 26,
    src: "https://images.unsplash.com/photo-1441260038675-7329ab4cc264?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    alt: "Woodland Path",
    description: "A winding path disappears into the forest depths",
    aspectRatio: "landscape",
  },
  {
    id: 27,
    src: "https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80",
    alt: "Autumn Leaves",
    description: "Golden leaves carpet the forest floor",
    aspectRatio: "square",
  },
  {
    id: 28,
    src: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80",
    alt: "Giant Sequoia",
    description: "A massive sequoia dwarfs everything around it",
    aspectRatio: "portrait",
  },
  {
    id: 29,
    src: "https://images.unsplash.com/photo-1574263867128-a3d5c1b1deaa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    alt: "Forest Undergrowth",
    description: "Lush ferns and undergrowth create a green carpet",
    aspectRatio: "landscape",
  },
  {
    id: 30,
    src: "https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80",
    alt: "Tree Canopy",
    description: "Looking up through the intricate forest canopy",
    aspectRatio: "square",
  },
]

const coastalPhotos: Photo[] = [
  {
    id: 31,
    src: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    alt: "Ocean Sunset",
    description: "The sun sets in brilliant colors over the endless Pacific",
    aspectRatio: "landscape",
  },
  {
    id: 32,
    src: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80",
    alt: "Rocky Coastline",
    description: "Waves crash against dramatic sea cliffs and rock formations",
    aspectRatio: "portrait",
  },
  {
    id: 33,
    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80",
    alt: "Lighthouse at Dawn",
    description: "A historic lighthouse stands sentinel over the morning sea",
    aspectRatio: "square",
  },
  {
    id: 34,
    src: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    alt: "Tide Pools",
    description: "Low tide reveals hidden worlds in natural rock pools",
    aspectRatio: "landscape",
  },
  {
    id: 35,
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80",
    alt: "Coastal Dunes",
    description: "Wind-sculpted sand dunes meet the endless blue horizon",
    aspectRatio: "portrait",
  },
  {
    id: 36,
    src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80",
    alt: "Seabird Colony",
    description: "Seabirds nest on dramatic cliff faces above crashing waves",
    aspectRatio: "square",
  },
  {
    id: 37,
    src: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80",
    alt: "Wave Crash",
    description: "Powerful waves explode against ancient sea stacks",
    aspectRatio: "portrait",
  },
  {
    id: 38,
    src: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    alt: "Coastal Fog",
    description: "Morning fog rolls in over the rugged coastline",
    aspectRatio: "landscape",
  },
  {
    id: 39,
    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80",
    alt: "Beach Stones",
    description: "Smooth stones polished by countless tides",
    aspectRatio: "square",
  },
  {
    id: 40,
    src: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80",
    alt: "Sea Cave",
    description: "Waves have carved intricate caves in the coastal cliffs",
    aspectRatio: "portrait",
  },
  {
    id: 41,
    src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    alt: "Sunset Reflection",
    description: "The setting sun paints the wet sand in golden hues",
    aspectRatio: "landscape",
  },
  {
    id: 42,
    src: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80",
    alt: "Ocean Horizon",
    description: "The infinite line where ocean meets sky",
    aspectRatio: "square",
  },
  {
    id: 43,
    src: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80",
    alt: "Cliff Edge",
    description: "Standing at the edge of towering sea cliffs",
    aspectRatio: "portrait",
  },
  {
    id: 44,
    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    alt: "Coastal Storm",
    description: "Storm clouds gather over the turbulent sea",
    aspectRatio: "landscape",
  },
  {
    id: 45,
    src: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80",
    alt: "Kelp Forest",
    description: "Underwater kelp forests sway in the ocean currents",
    aspectRatio: "square",
  },
]

const allPhotos = [...mountainPhotos, ...forestPhotos, ...coastalPhotos]

// Masonry layout component
const MasonryGrid: React.FC<{ photos: Photo[]; onPhotoClick: (photo: Photo) => void }> = ({ photos, onPhotoClick }) => {
  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-4 space-y-4">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="break-inside-avoid group cursor-pointer overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] mb-4"
          onClick={() => onPhotoClick(photo)}
        >
          <Image
            src={photo.src || "/placeholder.svg"}
            alt={photo.alt}
            width={photo.aspectRatio === "landscape" ? 800 : photo.aspectRatio === "portrait" ? 600 : 600}
            height={photo.aspectRatio === "landscape" ? 600 : photo.aspectRatio === "portrait" ? 800 : 600}
            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  )
}

export default function PhotoGallery() {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const openLightbox = (photo: Photo) => {
    setSelectedPhoto(photo)
    setCurrentIndex(allPhotos.findIndex((p) => p.id === photo.id))
  }

  const closeLightbox = () => {
    setSelectedPhoto(null)
  }

  const nextPhoto = () => {
    const nextIndex = (currentIndex + 1) % allPhotos.length
    setCurrentIndex(nextIndex)
    setSelectedPhoto(allPhotos[nextIndex])
  }

  const prevPhoto = () => {
    const prevIndex = (currentIndex - 1 + allPhotos.length) % allPhotos.length
    setCurrentIndex(prevIndex)
    setSelectedPhoto(allPhotos[prevIndex])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") closeLightbox()
    if (e.key === "ArrowRight") nextPhoto()
    if (e.key === "ArrowLeft") prevPhoto()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
          alt="Hero landscape"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center text-white max-w-4xl px-6">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">Nature's Canvas</h1>
          <p className="text-xl md:text-2xl font-light leading-relaxed opacity-90">
            A curated collection of breathtaking landscapes that showcase the raw beauty and untamed spirit of our
            natural world
          </p>
        </div>
      </div>

      {/* Mountain Gallery Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Mountain Majesty</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Towering peaks and alpine vistas that touch the sky, where silence speaks louder than words
          </p>
        </div>
        <MasonryGrid photos={mountainPhotos} onPhotoClick={openLightbox} />
      </section>

      {/* Forest Gallery Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Forest Sanctuary</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Ancient woodlands where time stands still and every breath connects you to the earth
          </p>
        </div>
        <MasonryGrid photos={forestPhotos} onPhotoClick={openLightbox} />
      </section>

      {/* Coastal Gallery Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Coastal Dreams</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Where land meets sea in an eternal dance of waves, wind, and endless horizons
          </p>
        </div>
        <MasonryGrid photos={coastalPhotos} onPhotoClick={openLightbox} />
      </section>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex flex-col"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
            onClick={closeLightbox}
          >
            <X className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
            onClick={(e) => {
              e.stopPropagation()
              prevPhoto()
            }}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
            onClick={(e) => {
              e.stopPropagation()
              nextPhoto()
            }}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>

          {/* Image container that takes remaining space */}
          <div className="flex-1 flex items-center justify-center p-4 pb-0" onClick={(e) => e.stopPropagation()}>
            <Image
              src={selectedPhoto.src || "/placeholder.svg"}
              alt={selectedPhoto.alt}
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Fixed description at bottom */}
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 pt-12">
            <div className="text-center text-white max-w-2xl mx-auto">
              <h3 className="text-2xl font-semibold mb-2">{selectedPhoto.alt}</h3>
              <p className="text-gray-300 text-lg">{selectedPhoto.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
