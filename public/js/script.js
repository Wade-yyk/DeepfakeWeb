document.addEventListener('DOMContentLoaded', function() {
    // Show default module (e.g., Introduction)
    showModule('introduction');
    // Initialize Community Forum functionalities
    setupCommunityForum();
    // Load and display images with voting controls from the server
    loadUploadedImages();
  });
  
  function showModule(moduleId) {
    const modules = document.querySelectorAll('.module');
    modules.forEach(module => {
      module.style.display = 'none';
    });
    const activeModule = document.getElementById(moduleId);
    if (activeModule) {
      activeModule.style.display = 'block';
    }
  }
  
  function setupCommunityForum() {
    const imageUploadInput = document.getElementById('image-upload');
    const uploadButton = document.getElementById('upload-button');
  
    uploadButton.addEventListener('click', function() {
      const files = imageUploadInput.files;
      if (files.length === 0) {
        alert('Please select an image to upload');
        return;
      }
      Array.from(files).forEach(file => {
        const formData = new FormData();
        formData.append('image', file);
  
        // POST image to /upload endpoint
        fetch('/upload', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          if (data.fileUrl) {
            addUploadedImage(data.fileUrl);
          } else {
            console.error('Upload failed', data);
          }
        })
        .catch(err => console.error('Error uploading:', err));
      });
    });
  }
  
  function loadUploadedImages() {
    fetch('/images')
      .then(response => response.json())
      .then(data => {
        if (data.images && data.images.length) {
          data.images.forEach(fileUrl => {
            addUploadedImage(fileUrl);
          });
        }
      })
      .catch(err => console.error('Error loading images:', err));
  }
  
  // Dynamically create a block for an uploaded image with voting controls
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
    button1.textContent = 'Option 1';
    const button2 = document.createElement('button');
    button2.textContent = 'Option 2';
  
    const progressBarContainer = document.createElement('div');
    progressBarContainer.className = 'progress-bar-container';
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.width = '0%';
    progressBarContainer.appendChild(progressBar);
  
    const percentageLabel = document.createElement('p');
    percentageLabel.className = 'percentage-label';
    percentageLabel.textContent = '0% Option 1 / 0% Option 2';
  
    voteContainer.appendChild(button1);
    voteContainer.appendChild(button2);
    voteContainer.appendChild(progressBarContainer);
    voteContainer.appendChild(percentageLabel);
  
    container.appendChild(img);
    container.appendChild(voteContainer);
  
    const uploadedImagesContainer = document.getElementById('uploaded-images-container');
    uploadedImagesContainer.appendChild(container);
  
    // Function to update UI using vote counts
    function updateUI(votes) {
      const total = votes.option1 + votes.option2;
      let percent1 = 0, percent2 = 0;
      if (total > 0) {
        percent1 = (votes.option1 / total) * 100;
        percent2 = (votes.option2 / total) * 100;
      }
      progressBar.style.width = percent1 + '%';
      percentageLabel.textContent = `${Math.round(percent1)}% Option 1 / ${Math.round(percent2)}% Option 2`;
    }
  
    // Load initial vote counts from server for this image
    fetch('/votes?imageUrl=' + encodeURIComponent(fileUrl))
      .then(response => response.json())
      .then(votes => {
        updateUI(votes);
      })
      .catch(err => console.error('Error loading votes:', err));
  
    // Function to send a vote to the server
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
  
    // Bind click events for voting buttons
    button1.addEventListener('click', function() {
      sendVote('option1');
    });
    button2.addEventListener('click', function() {
      sendVote('option2');
    });
  }
  