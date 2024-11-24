import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import './Home.css'

const Home = () => {

  const navigate = useNavigate();

  const handleTryDemo = () => {
    navigate("/SpeechPage");
  };

  useEffect(() => {
    const revealElements = () => {
      const reveals = document.querySelectorAll(".fade-in");
      for (let i = 0; i < reveals.length; i++) {
        const windowHeight = window.innerHeight;
        const elementTop = reveals[i].getBoundingClientRect().top;
        const elementVisible = 150;

        if (elementTop < windowHeight - elementVisible) {
          reveals[i].classList.add("active");
        } else {
          reveals[i].classList.remove("active");
        }
      }
    };

    window.addEventListener("scroll", revealElements);
    return () => window.removeEventListener("scroll", revealElements);
  }, []);

  return (
    <>
      <div className="landing-page">
        {/* Hero Section */}
        <header className="hero">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <h1 className="hero-title">
              Your Ultimate <span>AI Transcription Tool</span>
            </h1>
            <p className="hero-subtitle">
              Transform audio into text effortlessly with <br /> speed and precision. Designed for freelancers, professionals, and creatives.
            </p>
            <div className="hero-buttons">
              <button onClick={handleTryDemo}>
                Try Demo
              </button>
            </div>
          </div>
        </header>

        {/* What We Do Section */}
        <section className="what-we-do">
          <h2 className="section-title fade-in">What We Do</h2>
          <p className="section-description fade-in">
            Our tool revolutionizes the transcription process, making it easier, faster, and more accessible than ever before. Whether you’re handling interviews, podcasts, or lectures, we’ve got you covered.
          </p>
          <div className="features-grid">
            <div className="feature-card fade-in">
              <div className="icon">
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJYKx5fSU-L846_v8rHqUxm4bVlJrrIZN3Ig&s" alt="Upload" />
              </div>
              <h3>Easy Upload</h3>
              <p>Drag and drop your files effortlessly. No complicated setups.</p>
            </div>
            <div className="feature-card fade-in">
              <div className="icon">
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRumuItn_pxrkJQ2KwK9B1yfIHJIGmji0vVrw&s" alt="Speed" />
              </div>
              <h3>Lightning Fast</h3>
              <p>Powered by advanced AI, your transcription is ready in seconds.</p>
            </div>
            <div className="feature-card fade-in">
              <div className="icon">
                <img src="https://w7.pngwing.com/pngs/766/581/png-transparent-computer-icons-editing-others.png" alt="Edit" />
              </div>
              <h3>Effortless Editing</h3>
              <p>Make real-time edits directly within our tool—no additional software required.</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="key-features">
          <h2 className="section-title">Key Features</h2>
          <div className="divider"></div>
          <div className="features-grid">
            
            <div className="feature-card">
              <h3>High Accuracy</h3>
              <p>Leverage cutting-edge AI to deliver results you can trust.</p>
            </div>
            <div className="feature-card">
              <h3>Export Options</h3>
              <p>Easily export your transcription as TXT or PDF with or without timestamps.</p>
            </div>
            <div className="feature-card">
              <h3>Secure & Private</h3>
              <p>Your data remains encrypted and secure at all times.</p>
            </div>
          </div>
        </section>

        {/* Free Offer Section */}
        <section className="start-for-free">
          <h2 className="section-title">Start For Free</h2>
          <p>
            Join thousands of satisfied users who are already boosting their productivity with our tool. No hidden fees, no limitations—start today.
          </p>
        </section>

        {/* Footer */}
        <footer className="footer">
          <p>&copy; 2024 Freelancer Transcription Tool. All rights reserved.</p>
        </footer>
      </div>
    </>
  )
}

export default Home
