import React from 'react';
import assets from '../assets';

const WeatherComponent = ({ date, weatherImage, weatherState, weatherData }) => {
  return (
    <div style={{ background: 'darkslategray', opacity: 0.8, borderRadius: '20px', width : '25%' }}>
      <div style={{ textAlign: 'left', color: 'white', margin: '30px' }}>{date}</div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <img
          style={{ width: '200px', height: '250px' }} // Adjust the desired width and height values
          src={weatherImage}
          alt="Weather"
        />
      </div>

      <div
        style={{
          display: 'grid',
          color: 'white',
          gridTemplateColumns: 'repeat(2, 2fr)',
          gap: '10px',
          textAlign: 'center',
          paddingLeft : '15px',
          paddingRight : '15px'
        }}
      >
        {weatherData.map((data, index) => (
          <div key={index}>
            <div style={{ color: 'white' }}>{data.label}</div>
            <div style={{ color: 'white' }}>{data.value}</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', color: 'white', marginTop: '30px', fontWeight: 'bold', display : 'block' }}>
        {weatherState}
      </div>
    </div>
  );
};

export default WeatherComponent;