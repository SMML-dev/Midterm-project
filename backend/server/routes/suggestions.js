const express = require('express');
const router = express.Router();

const suggestions = [
  {
    id: 1,
    title: "Optimal Watering Times",
    content: "Water your plants early in the morning (6-8 AM) or late in the evening (6-8 PM) to minimize water evaporation and ensure maximum absorption.",
    category: "Watering",
    image: "🌅"
  },
  {
    id: 2,
    title: "Soil Moisture Monitoring",
    content: "Check soil moisture regularly. Most plants thrive when soil moisture is between 40-70%. Use your finger to test - if it's dry 2 inches deep, it's time to water.",
    category: "Monitoring",
    image: "🌱"
  },
  {
    id: 3,
    title: "Temperature Control",
    content: "Most vegetables prefer temperatures between 18-24°C. Monitor temperature closely and provide shade during hot periods to prevent stress.",
    category: "Environment",
    image: "🌡️"
  },
  {
    id: 4,
    title: "Humidity Levels",
    content: "Maintain humidity between 50-70% for optimal plant growth. Too high can cause fungal issues, too low can cause wilting.",
    category: "Environment",
    image: "💧"
  },
  {
    id: 5,
    title: "Plant Spacing",
    content: "Proper spacing allows for better air circulation and prevents disease spread. Follow spacing guidelines specific to each plant type.",
    category: "Planting",
    image: "📏"
  },
  {
    id: 6,
    title: "Seasonal Adjustments",
    content: "Adjust watering schedules based on seasons. Plants need more water in summer and less in winter. Monitor and adapt accordingly.",
    category: "Seasonal",
    image: "🍂"
  },
  {
    id: 7,
    title: "Signs of Overwatering",
    content: "Yellow leaves, wilting despite wet soil, and root rot are signs of overwatering. Let soil dry out between waterings.",
    category: "Troubleshooting",
    image: "⚠️"
  },
  {
    id: 8,
    title: "Signs of Underwatering",
    content: "Dry, brittle leaves, slow growth, and soil pulling away from pot edges indicate underwatering. Increase watering frequency.",
    category: "Troubleshooting",
    image: "🌵"
  },
  {
    id: 9,
    title: "Companion Planting",
    content: "Some plants grow better together! For example, tomatoes and basil are great companions. Research companion planting for your crops.",
    category: "Planting",
    image: "🤝"
  },
  {
    id: 10,
    title: "Nutrient Management",
    content: "Regular fertilization is key. Use organic fertilizers every 2-4 weeks during growing season. Monitor plant health for nutrient deficiencies.",
    category: "Nutrition",
    image: "🌿"
  }
];

// Get all suggestions
router.get('/', (req, res) => {
  res.json(suggestions);
});

// Get suggestion by category
router.get('/category/:category', (req, res) => {
  const category = req.params.category;
  const filtered = suggestions.filter(s => 
    s.category.toLowerCase() === category.toLowerCase()
  );
  res.json(filtered);
});

// Get random suggestion
router.get('/random', (req, res) => {
  const random = suggestions[Math.floor(Math.random() * suggestions.length)];
  res.json(random);
});

module.exports = router;

