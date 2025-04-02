function addUploadedImage(fileUrl) {
  const container = document.createElement('div');
  container.className = 'uploaded-item';

  // Create image element
  const img = document.createElement('img');
  img.src = fileUrl;
  img.alt = 'Uploaded Image';

  // Create voting controls container
  const voteContainer = document.createElement('div');
  voteContainer.className = 'button-container';

  const button1 = document.createElement('button');
  button1.textContent = 'Real'; 
  const button2 = document.createElement('button');
  button2.textContent = 'Fake'; 

  const progressBarContainer = document.createElement('div');
  progressBarContainer.className = 'progress-bar-container';
  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';
  progressBar.style.width = '0%';
  progressBarContainer.appendChild(progressBar);

  const percentageLabel = document.createElement('p');
  percentageLabel.className = 'percentage-label';
  percentageLabel.textContent = '0% Real / 0% Fake';

  // ✅ 创建删除按钮
  const deleteButton = document.createElement('button');
  deleteButton.textContent = '🗑️ Delete this picture';
  deleteButton.style.backgroundColor = '#e74c3c';
  deleteButton.addEventListener('click', () => {
    const filename = fileUrl.split('/').pop(); // 提取文件名
    fetch('/delete-image', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        container.remove(); // 从页面移除
      } else {
        alert('delete fail:' + data.error);
      }
    })
    .catch(err => {
      console.error('delete error:', err);
      alert('request for delete wrong');
    });
  });

  voteContainer.appendChild(button1);
  voteContainer.appendChild(button2);
  voteContainer.appendChild(progressBarContainer);
  voteContainer.appendChild(percentageLabel);
  voteContainer.appendChild(deleteButton); // ✅ 加进来

  container.appendChild(img);
  container.appendChild(voteContainer);

  const uploadedImagesContainer = document.getElementById('uploaded-images-container');
  uploadedImagesContainer.appendChild(container);

  function updateUI(votes) {
    const total = votes.option1 + votes.option2;
    let percent1 = 0, percent2 = 0;
    if (total > 0) {
      percent1 = (votes.option1 / total) * 100;
      percent2 = (votes.option2 / total) * 100;
    }
    progressBar.style.width = percent1 + '%';
    percentageLabel.textContent = `${Math.round(percent1)}% 真实 / ${Math.round(percent2)}% 伪造`;
  }

  fetch('/votes?imageUrl=' + encodeURIComponent(fileUrl))
    .then(response => response.json())
    .then(votes => {
      updateUI(votes);
    })
    .catch(err => console.error('Error loading votes:', err));

  function sendVote(option) {
    fetch('/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: fileUrl, option: option })
    })
    .then(response => response.json())
    .then(votes => {
      updateUI(votes);
    })
    .catch(err => console.error('Error sending vote:', err));
  }

  button1.addEventListener('click', function() {
    sendVote('option1');
  });
  button2.addEventListener('click', function() {
    sendVote('option2');
  });
}
