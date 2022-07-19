import React from 'react';

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className='Footer'>
      <p>Made by An89Tn, Copyright ⓒ {year}</p>
    </footer>
  );
}

export default Footer;