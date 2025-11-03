document.getElementById('convertForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = document.getElementById('fileInput').files[0];
  const format = document.getElementById('formatSelect').value;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('format', format);
  const status = document.getElementById('status');
  status.innerText = 'Converting... please wait.';
  try {
    const response = await fetch('/api/convert', { method: 'POST', body: formData });
    if (!response.ok) throw new Error('Conversion failed');
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'converted.' + format;
    link.click();
    status.innerText = 'Conversion successful!';
  } catch {
    status.innerText = 'Conversion failed. Try again.';
  }
});