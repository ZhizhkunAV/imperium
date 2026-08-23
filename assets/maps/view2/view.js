/**
 * Вид 2 — 3D карта провинций (Three.js + DEM).
 * Ассеты папки: underlay/labels сохранены; карта — map.html.
 */
window.MapView2 = {
  id: 2,
  mapUrl: '/maps/view2/map.html',
  assets: {
    2: {
      underlay: ['/maps/view2/underlay.jpg', '/maps/view2/underlay_1x.png'],
      labels: ['/maps/view2/labels.png', '/maps/view2/labels_1x.png'],
      regionsKey: 'View2PixelRegions'
    }
  },
  paintBase: function (ctx, img, cover, canvasW, canvasH) {
    ctx.clearRect(0, 0, canvasW, canvasH);
    if (!img || !cover) return;
    ctx.drawImage(img, cover.dx, cover.dy, cover.dw, cover.dh);
  }
};
