// Plant search service using Unsplash API for images

const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY';
const UNSPLASH_API = 'https://api.unsplash.com';

const PLANT_IMAGES = {
  'Tomato': 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400',
  'Lettuce': 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400',
  'Basil': 'https://images.unsplash.com/photo-1618375569909-4ad8a0e7321f?w=400',
  'Pepper': 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400',
  'Cucumber': 'https://images.unsplash.com/photo-1604977043462-72738e9bfd9e?w=400',
  'Strawberry': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400',
  'Herbs': 'https://images.unsplash.com/photo-1618375569909-4ad8a0e7321f?w=400',
  'Other': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
};

export const searchPlantImage = async (plantName, plantType) => {
  try {
    if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'YOUR_UNSPLASH_ACCESS_KEY') {
      return PLANT_IMAGES[plantType] || PLANT_IMAGES['Other'];
    }

    const searchQuery = `${plantName} ${plantType} plant`;
    const response = await fetch(
      `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&client_id=${UNSPLASH_ACCESS_KEY}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].urls.regular;
      }
    }
    
    return PLANT_IMAGES[plantType] || PLANT_IMAGES['Other'];
  } catch (error) {
    console.error('Error fetching plant image:', error);
    return PLANT_IMAGES[plantType] || PLANT_IMAGES['Other'];
  }
};

export const getDefaultPlantImage = (plantType) => {
  return PLANT_IMAGES[plantType] || PLANT_IMAGES['Other'];
};

