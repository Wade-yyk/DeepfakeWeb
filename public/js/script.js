document.addEventListener('DOMContentLoaded', function() {
    showModule('introduction');
    setupCommunityForum();
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
  
  function addUploadedImage(fileUrl) {
    const container = document.createElement('div');
    container.className = 'uploaded-item';
  
    const img = document.createElement('img');
    img.src = fileUrl;
    img.alt = 'Uploaded Image';
  
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
  
    voteContainer.appendChild(button1);
    voteContainer.appendChild(button2);
    voteContainer.appendChild(progressBarContainer);
    voteContainer.appendChild(percentageLabel);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = '🗑️ Delete';
    deleteButton.style.backgroundColor = '#e74c3c';

    deleteButton.addEventListener('click', () => {
      const filename = fileUrl.split('/').pop();
      fetch('/delete-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          container.remove(); 
        } else {
          alert('Delete failed: ' + data.error);
        }
      })
      .catch(err => {
        console.error('Error deleting:', err);
        alert('Delete request error');
      });
    });

    voteContainer.appendChild(deleteButton);

  
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
      percentageLabel.textContent = `${Math.round(percent1)}% Real / ${Math.round(percent2)}% Fake`;
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
  
  const flashcardData = [
    {
      question: "You receive a voice call that sounds exactly like your boss, urgently asking you to transfer company funds. You later find out your boss never made the call. What’s really going on?",
      answer: "This is likely a deepfake voice scam. Scammers can use AI to clone voices and manipulate people using realistic audio impersonations, especially in high-pressure situations where trust is exploited."
    },
    {
      question: "A high school student is being bullied after a video surfaces showing them making offensive remarks—but they insist they never said those things. What might explain this?",
      answer: "A deepfake video could have been used to fabricate the remarks. This shows how deepfake tools can be misused for bullying and defamation, even by other children, due to how accessible the technology has become."
    },
    {
      question: "An elderly person buys an expensive “miracle cure” after seeing a convincing video ad featuring a trusted celebrity. Later, they learn the product is fake. What made the scam so effective?",
      answer: "Deepfake video or voice was likely used to falsely show the celebrity endorsing the product. Combined with targeting vulnerable people online, this makes scams feel trustworthy and believable."
    },
    {
      question: "A woman discovers sexually explicit videos of herself circulating online, even though she never made them. What kind of harm is this—and how does AI play a role?",
      answer: "This is a case of non-consensual deepfake content, where AI is used to superimpose someone’s face onto explicit material. It’s a serious violation of privacy and dignity, often leading to emotional and reputational damage."
    },
    {
      question: "You connect with someone on a dating app who shares photos and short videos of themselves, but always avoids live video calls. They eventually ask you for money. What red flags should you consider?",
      answer: "This could be a deepfake-based romance scam. AI-generated faces and videos can now simulate real people, making emotional manipulation easier in catfishing situations."
    },{
      question: "If you find yourself under deepfake technology harassment, what should you do? What if your family member, friend, or classmate is a victim—how would you support them?",
      answer: "Report the content to the platform immediately and document everything. Offer emotional support to the victim and help them report the incident to trusted adults, school staff, or authorities. Remind them it’s not their fault and they don’t have to face it alone."
    },{
      question: "What steps can schools and universities take to educate students about deepfakes and digital safety?",
      answer: "They can integrate lessons on digital literacy, teach how to verify sources, host workshops on AI ethics, and provide support systems for students affected by digital harassment."
    },{
      question: "Imagine someone says, “It’s just a joke!” after sharing a deepfake video of a friend. Why is this mindset harmful?",
      answer: "It downplays the serious emotional and social impact deepfake misuse can have. What seems like a “joke” can lead to bullying, reputational damage, or trauma, especially if the video spreads beyond the original group."
    },{
      question: "Why is it important to include diverse voices and age groups in conversations about deepfakes and AI abuse?",
      answer: "Because people are affected differently. Elders, teens, parents, and workers all face unique risks—and including their perspectives helps build more effective awareness, support, and protection systems."
    },{
      question: "What kind of future do we risk if we ignore the dangers of deepfake technology?",
      answer: "A world where truth becomes harder to recognize, trust erodes between people, and vulnerable individuals face increasing harm from invisible attackers. Awareness and action now can help prevent that."
    }
  ];
  
  function createFlashcards() {
    const container = document.getElementById('flashcards-container');
    flashcardData.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'flashcard';
      card.dataset.index = index;
  
      const content = document.createElement('div');
      content.className = 'card-content question';
      content.textContent = item.question;
  
      card.appendChild(content);
      card.addEventListener('click', () => flipCard(card));
      container.appendChild(card);
    });
  }
  
  function flipCard(card) {
    const index = card.dataset.index;
    const content = card.querySelector('.card-content');
    const data = flashcardData[index];
  
    if (content.classList.contains('question')) {
      content.textContent = data.answer;
      content.classList.remove('question');
      content.classList.add('answer');
    } else {
      content.textContent = data.question;
      content.classList.remove('answer');
      content.classList.add('question');
    }
  }
  
  document.addEventListener('DOMContentLoaded', createFlashcards);
  