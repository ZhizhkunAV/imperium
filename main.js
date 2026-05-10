// AI Image Generation using OpenAI DALL-E
async function generateImage(prompt, containerId, buttonId) {
  const container = document.getElementById(containerId);
  const button = document.getElementById(buttonId);
  if (button) {
    button.textContent = 'Генерирую...';
    button.disabled = true;
  }
  
  container.innerHTML = '<p>Генерация изображения...</p>';
  
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer YOUR_OPENAI_API_KEY` // Replace with your API key
      },
      body: JSON.stringify({
        prompt: prompt,
        n: 1,
        size: '512x512'
      })
    });
    
    const data = await response.json();
    if (data.data && data.data[0]) {
      container.innerHTML = `<img src="${data.data[0].url}" alt="Generated Image">`;
    } else {
      container.innerHTML = '<p>Ошибка генерации изображения. Проверьте API ключ.</p>';
    }
  } catch (error) {
    console.error('Error generating image:', error);
    container.innerHTML = '<p>Ошибка подключения к AI. Установите API ключ в коде.</p>';
  } finally {
    if (button) {
      button.textContent = 'Генерация карты AI';
      button.disabled = false;
    }
  }
}

// Background Music
let globalAudio = null;

function initBackgroundMusic() {
  const audioSrc = './assets/audio/Orkestr_Ujelskogo_polka_-_Marsh_britanskikh_grenaderov_65073420.mp3';
  const audio = new Audio(audioSrc);
  globalAudio = audio;
  audio.loop = true;
  audio.volume = 0.3;
  
  audio.addEventListener('error', (e) => {
    console.error('Audio load error:', e);
  });
  
  audio.addEventListener('canplaythrough', () => {
    console.log('Audio ready to play');
  });
  
  // Restore state from localStorage
  const musicPlaying = localStorage.getItem('musicPlaying') === 'true';
  const currentTime = parseFloat(localStorage.getItem('musicCurrentTime') || '0');
  
  if (musicPlaying) {
    audio.currentTime = currentTime;
    audio.play().then(() => {
      console.log('Music resumed');
    }).catch(e => console.log('Resume failed:', e));
  }
  
  // Save state on unload
  window.addEventListener('beforeunload', () => {
    localStorage.setItem('musicPlaying', audio.paused ? 'false' : 'true');
    localStorage.setItem('musicCurrentTime', audio.currentTime.toString());
  });
  
  // Create container for buttons
  const btnContainer = document.createElement('div');
  btnContainer.className = 'music-btn-container';
  
  // Create unmute button
  const unmuteBtn = document.createElement('button');
  unmuteBtn.textContent = 'Звук вкл';
  unmuteBtn.className = 'btn music-btn music-btn-unmute';
  unmuteBtn.id = 'unmute-btn';
  unmuteBtn.onclick = () => {
    audio.play().then(() => {
      console.log('Audio playing');
      localStorage.setItem('musicPlaying', 'true');
      unmuteBtn.classList.add('active');
      muteBtn.classList.remove('active');
    }).catch(e => {
      console.log('Audio play failed:', e);
    });
  };
  
  // Create mute button
  const muteBtn = document.createElement('button');
  muteBtn.textContent = 'Звук выкл';
  muteBtn.className = 'btn music-btn music-btn-mute';
  muteBtn.id = 'mute-btn';
  muteBtn.onclick = () => {
    audio.pause();
    console.log('Audio paused');
    localStorage.setItem('musicPlaying', 'false');
    muteBtn.classList.add('active');
    unmuteBtn.classList.remove('active');
  };
  
  btnContainer.appendChild(unmuteBtn);
  btnContainer.appendChild(muteBtn);
  document.body.appendChild(btnContainer);
  
  // Set initial active state
  if (musicPlaying) {
    unmuteBtn.classList.add('active');
  } else {
    muteBtn.classList.add('active');
  }
  
  // Auto-play attempt (may be blocked)
  if (!musicPlaying) {
    audio.play().then(() => {
      console.log('Auto-play successful');
      localStorage.setItem('musicPlaying', 'true');
      unmuteBtn.classList.add('active');
      muteBtn.classList.remove('active');
    }).catch((e) => {
      console.log('Auto-play blocked:', e);
      muteBtn.classList.add('active');
      unmuteBtn.classList.remove('active');
    });
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  initBackgroundMusic();
  
  // Faction selection
  const factionButtons = document.querySelectorAll('.faction-button');
  const descriptionDiv = document.querySelector('.campaign-description');
  
  const descriptions = {
    julii: `
      <p><strong>Дом Юлиев — 270 до нашей эры</strong></p>
      <p>Боги покровительствуют дому Юлиев. Амбиции и политическая смекалка сделали их влиятельнейшей семьёй Рима. Подобно своему божественному предку Венере, Юлии наделены обаянием, красноречием и неукротимой волей к победе.</p>
      <p>Их владения лежат в северной Италии, а взоры устремлены на варварские земли Галлии и Британии. Если Юлии сумеют покорить эти дикие племена, Рим будет у их ног. Но главное сражение ждёт в Сенате — только тот, кто заручится поддержкой народа и богов, станет истинным властелином Республики.</p>
    `,
    carthage: `
      <p><strong>Карфаген — 270 до нашей эры</strong></p>
      <p>Карфаген — город золота и слоновой кости, жемчужина Средиземноморья. Основанный финикийскими купцами, он превратился в величайшую торговую державу древнего мира. Его корабли бороздят моря от берегов Африки до Британии, а сундуки ломятся от богатств.</p>
      <p>Но тень Рима нависла над Карфагеном. Ганнибал уже перешёл Альпы и нанёс Республике страшные раны, но этого мало. Чтобы сломить Рим, понадобится не только военный гений, но и хитрость, дипломатия и безжалостность. Флот Карфагена не знает равных, а боевые слоны вселяют ужас в сердца врагов. Пришло время напомнить Риму, кто настоящий хозяин Средиземноморья.</p>
    `
  };
  
  factionButtons.forEach(button => {
    button.addEventListener('click', () => {
      factionButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      const faction = button.dataset.faction;
      if (descriptionDiv && descriptions[faction]) {
        descriptionDiv.innerHTML = descriptions[faction];
      }
    });
  });
  
  const generateMapBtn = document.getElementById('generate-map-btn');
  if (generateMapBtn) {
    generateMapBtn.addEventListener('click', () => {
      generateImage('Stylized map of the Mediterranean in Rome Total War style, dark theme with gold accents', 'map-image', 'generate-map-btn');
    });
  }
  
  const generateAboutBtn = document.getElementById('generate-about-btn');
  if (generateAboutBtn) {
    generateAboutBtn.addEventListener('click', () => {
      generateImage('Ancient Roman battlefield scene with legions and elephants, epic and dramatic', 'about-image', 'generate-about-btn');
    });
  }
});