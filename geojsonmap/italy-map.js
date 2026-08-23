const italyProvinces = [
  {
    id: 'liguria',
    name: 'Лигурия',
    city: 'Генуя',
    color: '#4d8a68',
    points: [[60, 180], [140, 150], [200, 190], [175, 260], [110, 285], [60, 250]]
  },
  {
    id: 'lombardia',
    name: 'Ломбардия',
    city: 'Милан',
    color: '#5ca06d',
    points: [[160, 120], [260, 80], [340, 110], [335, 200], [240, 240], [150, 220], [140, 150]]
  },
  {
    id: 'veneto',
    name: 'Венеция',
    city: 'Венеция',
    color: '#6db67d',
    points: [[335, 110], [455, 90], [540, 150], [520, 235], [435, 255], [335, 200]]
  },
  {
    id: 'latium',
    name: 'Лацио',
    city: 'Рим',
    color: '#81c57e',
    points: [[225, 250], [320, 220], [420, 260], [470, 340], [440, 470], [325, 500], [245, 420], [210, 330]]
  },
  {
    id: 'campania',
    name: 'Кампания',
    city: 'Неаполь',
    color: '#93d680',
    points: [[305, 500], [420, 490], [500, 555], [470, 650], [350, 680], [270, 600], [290, 535]]
  },
  {
    id: 'sicily',
    name: 'Сицилия',
    city: 'Палермо',
    color: '#b4df84',
    points: [[500, 615], [620, 595], [690, 660], [655, 760], [540, 760], [485, 700], [490, 640]]
  }
];

const mapContainer = document.getElementById('italyMap');
if (mapContainer) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 760 820');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.display = 'block';
  svg.style.background = 'radial-gradient(circle at 50% 30%, rgba(35, 42, 30, 0.92), rgba(12, 10, 7, 0.96) 62%)';
  svg.style.border = '1px solid rgba(201,168,76,0.35)';
  svg.style.borderRadius = '10px';
  svg.style.boxShadow = '0 0 24px rgba(0,0,0,0.35)';

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const glow = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  glow.setAttribute('id', 'provinceGlow');
  const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
  blur.setAttribute('stdDeviation', '1.2');
  glow.appendChild(blur);
  defs.appendChild(glow);
  svg.appendChild(defs);

  italyProvinces.forEach((province) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = province.points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ') + ' Z';
    path.setAttribute('d', d);
    path.setAttribute('fill', province.color);
    path.setAttribute('stroke', '#d9c07d');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('opacity', '0.9');
    path.setAttribute('filter', 'url(#provinceGlow)');
    path.style.cursor = 'pointer';
    path.style.transition = 'all 0.2s ease';

    const cityPoint = province.points[0];
    const cityX = cityPoint[0] + 12;
    const cityY = cityPoint[1] + 10;

    path.addEventListener('click', () => {
      const isSelected = path.dataset.selected === 'true';
      path.dataset.selected = String(!isSelected);
      path.setAttribute('fill', isSelected ? province.color : '#2ecc71');
      path.setAttribute('stroke', isSelected ? '#d9c07d' : '#dfffbf');
      path.setAttribute('stroke-width', isSelected ? '2' : '3');
    });

    svg.appendChild(path);

    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', cityX);
    dot.setAttribute('cy', cityY);
    dot.setAttribute('r', '6');
    dot.setAttribute('fill', '#f0d77d');
    dot.setAttribute('stroke', '#1d1208');
    dot.setAttribute('stroke-width', '2');
    svg.appendChild(dot);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', cityX + 12);
    label.setAttribute('y', cityY - 8);
    label.setAttribute('fill', '#f7e7b7');
    label.setAttribute('font-size', '13');
    label.setAttribute('font-family', 'Cinzel, serif');
    label.setAttribute('letter-spacing', '0.8');
    label.textContent = province.city;
    svg.appendChild(label);
  });

  const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  shadow.setAttribute('cx', '360');
  shadow.setAttribute('cy', '740');
  shadow.setAttribute('rx', '220');
  shadow.setAttribute('ry', '42');
  shadow.setAttribute('fill', 'rgba(0,0,0,0.38)');
  svg.insertBefore(shadow, svg.firstChild);

  mapContainer.appendChild(svg);
}
