/**
 * Вариант 2 — точные границы Италии (материк), 4 провинции по суше.
 * Стиль: EU4 / Victoria — заливка провинций, города-метки, дороги между столицами.
 */
window.MapVariant2 = (function () {
  const CITIES = [
    { id: 'milan', name: 'Милан', lon: 9.19, lat: 45.46, province: 'northwest' },
    { id: 'venice', name: 'Венеция', lon: 12.32, lat: 45.44, province: 'northeast' },
    { id: 'genoa', name: 'Генуя', lon: 8.94, lat: 44.41, province: 'northwest' },
    { id: 'rome', name: 'Рим', lon: 12.50, lat: 41.90, province: 'center' },
    { id: 'naples', name: 'Неаполь', lon: 14.25, lat: 40.85, province: 'south' },
  ];

  let destroyFn = null;

  function openProvinceDetail(entityId) {
    const url = `./pageOfDetailAboutUnitAndBuild.html?entity=${encodeURIComponent(entityId)}`;
    if (window.openSecondaryModal) {
      window.openSecondaryModal(url, { position: 'left' });
    }
  }

  function mount(container) {
    if (!container || !window.d3) return () => {};
    if (destroyFn) destroyFn();
    container.innerHTML = '';

    const width = container.clientWidth || 1100;
    const height = container.clientHeight || 760;
    const d3 = window.d3;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('display', 'block')
      .style('background', 'radial-gradient(circle at 50% 35%, #1c3344 0%, #0a1218 70%)')
      .style('cursor', 'grab');

    const root = svg.append('g');
    const zoom = d3.zoom()
      .scaleExtent([0.7, 14])
      .on('zoom', (event) => {
        root.attr('transform', event.transform);
        const k = event.transform.k;
        root.selectAll('path.province').attr('stroke-width', 1.4 / Math.sqrt(k));
        root.selectAll('path.province-selected').attr('stroke-width', 3.4 / Math.sqrt(k));
        root.selectAll('path.coast').attr('stroke-width', 2 / Math.sqrt(k));
        root.selectAll('path.road').attr('stroke-width', 1.5 / Math.sqrt(k));
      });
    svg.call(zoom);

    let provinceSel = null;

    Promise.all([
      fetch('/maps/variant2/italy.geojson').then((r) => {
        if (!r.ok) throw new Error('italy.geojson');
        return r.json();
      }),
      fetch('/maps/variant2/provinces.geojson').then((r) => {
        if (!r.ok) throw new Error('provinces.geojson');
        return r.json();
      }),
      fetch('/maps/variant2/roads.geojson').then((r) => (r.ok ? r.json() : { type: 'FeatureCollection', features: [] })),
    ]).then(([italy, provinces, roads]) => {
      const landForFit = {
        type: 'FeatureCollection',
        features: provinces.features.length ? provinces.features : italy.features,
      };
      const projection = d3.geoMercator()
        .fitExtent([[36, 24], [width - 28, height - 24]], landForFit);
      const path = d3.geoPath(projection);

      // sea plate under land
      root.append('rect')
        .attr('x', 0).attr('y', 0)
        .attr('width', width).attr('height', height)
        .attr('fill', 'transparent');

      // provinces = land fills
      provinceSel = root.selectAll('path.province')
        .data(provinces.features)
        .join('path')
        .attr('class', 'province')
        .attr('d', path)
        .attr('fill', (d) => d.properties.color || '#7a8a60')
        .attr('fill-opacity', 0.92)
        .attr('stroke', '#1a1208')
        .attr('stroke-width', 1.4)
        .attr('stroke-linejoin', 'round')
        .style('cursor', 'pointer')
        .on('mouseenter', function () {
          if (d3.select(this).classed('province-selected')) return;
          d3.select(this).attr('fill-opacity', 1);
        })
        .on('mouseleave', function () {
          if (d3.select(this).classed('province-selected')) return;
          d3.select(this).attr('fill-opacity', 0.92);
        })
        .on('click', function (event, d) {
          event.stopPropagation();
          provinceSel
            .classed('province-selected', false)
            .attr('stroke', '#1a1208')
            .attr('stroke-width', 1.4)
            .attr('filter', null)
            .attr('fill-opacity', 0.92);
          d3.select(this)
            .classed('province-selected', true)
            .attr('stroke', '#2ecc71')
            .attr('stroke-width', 3.4)
            .attr('filter', 'drop-shadow(0 0 8px rgba(46,204,113,0.95))')
            .attr('fill-opacity', 1);
        })
        .on('contextmenu', function (event, d) {
          event.preventDefault();
          event.stopPropagation();
          provinceSel
            .classed('province-selected', false)
            .attr('stroke', '#1a1208')
            .attr('stroke-width', 1.4)
            .attr('filter', null)
            .attr('fill-opacity', 0.92);
          d3.select(this)
            .classed('province-selected', true)
            .attr('stroke', '#2ecc71')
            .attr('stroke-width', 3.4)
            .attr('filter', 'drop-shadow(0 0 8px rgba(46,204,113,0.95))')
            .attr('fill-opacity', 1);
          openProvinceDetail(d.properties.entity || d.properties.id);
        });

      // outer coast outline on top of provinces
      root.selectAll('path.coast')
        .data(italy.features)
        .join('path')
        .attr('class', 'coast')
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', '#d9c07d')
        .attr('stroke-width', 2)
        .attr('stroke-linejoin', 'round')
        .attr('pointer-events', 'none');

      root.selectAll('path.road')
        .data(roads.features)
        .join('path')
        .attr('class', 'road')
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', '#e8d59a')
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.8)
        .attr('stroke-linecap', 'round')
        .attr('stroke-dasharray', '4 3')
        .attr('pointer-events', 'none');

      const cityG = root.selectAll('g.city')
        .data(CITIES)
        .join('g')
        .attr('class', 'city')
        .attr('transform', (d) => {
          const p = projection([d.lon, d.lat]);
          return p ? `translate(${p[0]},${p[1]})` : 'translate(0,0)';
        })
        .attr('pointer-events', 'none');

      cityG.append('circle')
        .attr('r', 4.5)
        .attr('fill', '#ffe6a0')
        .attr('stroke', '#1a1008')
        .attr('stroke-width', 1.1);

      cityG.append('text')
        .attr('x', 8)
        .attr('y', 4)
        .attr('fill', '#f7edd2')
        .attr('font-size', 12)
        .attr('font-family', 'Cinzel, Georgia, serif')
        .attr('paint-order', 'stroke')
        .attr('stroke', 'rgba(0,0,0,0.65)')
        .attr('stroke-width', 3)
        .text((d) => d.name);
    }).catch((err) => {
      console.error('MapVariant2 load failed', err);
      container.innerHTML = '<div style="color:#c9a84c;padding:20px;font-family:Cinzel,serif;">Карта (вариант 2) недоступна</div>';
    });

    destroyFn = () => {
      container.innerHTML = '';
      destroyFn = null;
    };
    return destroyFn;
  }

  return { mount };
})();
