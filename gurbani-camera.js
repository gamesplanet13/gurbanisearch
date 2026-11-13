/* Camera selection shared by Controller and Camera Phone. */
(function () {
  'use strict';

  async function devices() {
    const media = navigator.mediaDevices;
    if (!media || !media.enumerateDevices) return [];
    const cameras = (await media.enumerateDevices()).filter(device => device.kind === 'videoinput' && device.deviceId);
    return cameras.map((device, index) => ({id: device.deviceId, name: device.label || 'Camera ' + (index + 1)}));
  }

  function options(select, cameras, selected) {
    select.textContent = '';
    select.add(new Option('Default camera', ''));
    cameras.forEach(camera => select.add(new Option(camera.name, camera.id)));
    if (cameras.some(camera => camera.id === selected)) select.value = selected;
  }

  function stop(stream) {
    if (stream) stream.getTracks().forEach(track => track.stop());
  }

  function start(deviceId) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw Error('Camera requires HTTPS and a compatible Android WebView.');
    }
    const video = {width:{ideal:1280}, height:{ideal:720}, frameRate:{ideal:24,max:30}};
    if (deviceId) video.deviceId = {exact:deviceId};
    else video.facingMode = {ideal:'environment'};
    return navigator.mediaDevices.getUserMedia({audio:false,video});
  }

  function framing(settings) {
    const clamp = (value, low, high, fallback) => Math.max(low, Math.min(high, Number.isFinite(Number(value)) ? Number(value) : fallback));
    return {
      fit: settings.fit === 'cover' ? 'cover' : 'contain',
      zoom: clamp(settings.zoom, 1, 4, 1),
      x: clamp(settings.x, 0, 100, 50),
      y: clamp(settings.y, 0, 100, 50)
    };
  }

  function frame(video, settings) {
    const view = framing(settings);
    video.style.objectFit = view.fit;
    video.style.objectPosition = view.x + '% ' + view.y + '%';
    video.style.transformOrigin = video.style.objectPosition;
    video.style.transform = 'scale(' + view.zoom + ')';
  }

  window.GurbaniCamera = {devices, options, start, stop, frame};
})();
