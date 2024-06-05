import React, { useState } from 'react';
import assets from '../assets';
import MinuteCard from './minCard';

const SessionCard = ({ sessionData }) => {
    const [isVisible, setIsVisible] = useState(false)
    const [isMinVisible, setIsMinVisible] = useState(false)
    const onCardClick = () => {
        setIsVisible(!isVisible)
    }
    const onHourClick = () => {
        setIsMinVisible(!isMinVisible)
    }
    return (
        <div>
            <div className="day" onClick={onCardClick} style={{ color: 'black', fontWeight : 'bold' }}>
                <div style={{ color: 'black', width: '15%', fontWeight : 'bold' }}>
                    {sessionData.name}
                </div>
                <div className='currentCard_properties'>
                    <span style={{ lineHeight: '1.1' }}><div>High</div><div>{sessionData != undefined ? sessionData.tempmax : ""}℃</div><div>Feels:{sessionData != undefined ? sessionData.feelsMax : ""}℃</div></span>
                    <span style={{ lineHeight: '1.1' }}><div>Low</div><div>{sessionData != undefined ? sessionData.tempmin : ""}℃</div><div>Feels:{sessionData != undefined ? sessionData.feelsMin : ""}℃</div></span>
                    <span style={{ lineHeight: '1.1' }}><div>Precip</div><div>{sessionData != undefined ? sessionData.precipprob : ""}%</div><div>{sessionData != undefined ? sessionData.precip : ""}mm</div></span>
                </div>
            </div>

            {isVisible ? sessionData.hours.map((hour) => (
                 <MinuteCard hourData={hour} />

            )) : ""}

        </div>


    );
};

export default SessionCard;