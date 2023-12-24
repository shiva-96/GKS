import React, { useState } from 'react';
import axios from 'axios';
// import { useHistory } from 'react-router-dom';

const UrlHasherApp = () => {
    const [originalUrl, setOriginalUrl] = useState('');
    const [expiresAfter, setExpiresAfter] = useState('');
    const [hashedUrl, setHashedUrl] = useState('');
    const [getSavedUrlID, setgetSavedUrlID] = useState('');
    
    const generateHash = async () => {
        try {
            await axios.post('http://localhost:8081/encrypt', {
                originalUrl:originalUrl,
                expiresAfter: expiresAfter ? parseInt(expiresAfter) : undefined,
            }).then((data)=>{
                setgetSavedUrlID(data.data.urlId)
                setHashedUrl(data.data.hashedUrl);
            }).catch((error)=>{
                console.log(error);
            })

        } catch (error) {
            console.error('Error generating hash:', error);
        }
    };

    const goOnTheUrl = async ()=>{
        try {
            alert(getSavedUrlID)
            await axios.post('http://localhost:8081/decrypt', {
                encryptedData:hashedUrl,
                savedId:getSavedUrlID,
                currdate : new Date()
            }).then((data)=>{
                if (data.data.decryptedUrl) {
                    window.location.href = data.data.decryptedUrl;
                }else{
                    alert("wrong url");
                }
            }).catch((error)=>{
                console.log(error);
            })
        } catch (error) {
            console.log(error);
        }

    }

    return (
        <div className='container my-3'>
            <h2>URL Hasher</h2>
            <form className="form-inline">
                <div className="form-group mx-sm-3 mb-2">
                    <label htmlFor="originalUrl" className="sr-only">Original Url</label>
                    <input type="text" id='originalUrl' className="form-control" placeholder="Enter the original URL"
                        value={originalUrl}
                        onChange={(e) => setOriginalUrl(e.target.value)} />
                </div>
                <div className="form-group mx-sm-3 mb-2">
                    <label htmlFor="expireAfter" className="sr-only">Expire After</label>
                    <input type="text" className="form-control" id="expireAfter" placeholder="Expires after (milliseconds)"
                        value={expiresAfter}
                        onChange={(e) => setExpiresAfter(e.target.value)} />
                </div>
                <button type='button'  className="btn btn-primary mb-2" onClick={generateHash}>Generate Hash</button>
                {hashedUrl && (
                    <div style={{width:"100%"}}>
                        <b>Hashed URL:</b>
                        <a style={{cursor:"pointer"}} onClick={goOnTheUrl}  target='_blank'>
                            {hashedUrl}
                        </a>
                    </div>
                )}
            </form>
        </div>
    );
};

export default UrlHasherApp;
