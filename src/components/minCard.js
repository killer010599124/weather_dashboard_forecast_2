import React, { useState } from 'react';

const MinuteCard = ({ hourData }) => {
    // console.log(minuteData)
    const [isVisible, setIsVisible] = useState(false)

    const onHourClick = () => {
        // alert("hello")
        setIsVisible(!isVisible)
    }


    return (
        <div>
            <div className="hourCard" onClick={onHourClick} style={{fontWeight : 'bold'}}>

                <div className='hourCard_icon'>
                    <img // Adjust the desired width and height values
                        style={{ width: '30px', height: '30px' }}
                        src={`../icons/${hourData.icon}.svg`}
                        alt="Weather"
                    />
                    <div style={{ color: 'black' }}>
                        {hourData.datetime.slice(0, 5)}
                    </div>
                </div>
                <div className='hourCard_properties' style={{ width: '85%' }}>
                    <span ><div>{hourData.temp}℃</div><div>Feels:{hourData.feelslike}℃</div></span>
                    <span><div>Precip</div><div>{hourData.precip}%</div></span>
                    <span><div>Wind</div><div>{hourData.windspeed}mb</div></span>
                    <span><div>UVI</div><div>{hourData.uvindex}</div></span>
                </div>

            </div>

            {hourData.minutes.map((minuteData, index) => (
                <div >
                    {isVisible ?
                        <div className="hourCard" style={{ marginLeft: "50px", fontWeight : 'bold' }}>
                            <div className="minuteCard_time">
                                {minuteData.datetime}
                            </div>
                            <div className="hourCard_properties">
                                <span>
                                    <div>Temp</div>
                                    <div>{minuteData.temp}℃</div>
                                </span>
                                <span>
                                    <div>Precip</div>
                                    <div>{minuteData.precip}%</div>
                                </span>
                                <span>
                                    <div>Wind</div>
                                    <div>{minuteData.windspeed}mb</div>
                                </span>
                            </div>
                        </div> : ""}

                </div>
            ))}

        </div>



    );
};

export default MinuteCard;