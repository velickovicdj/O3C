import React from "react";
import { ReactComponent as PlistFileIcon } from "../assets/icons/plist.svg";

export default function Reader({ setViewerData }) {
    const defaultValue = "0.9.1";

    const storeData = file => {
        if (file.name.match(/\.[0-9a-z]+$/i)[0] === ".plist") { // Check for valid file extension
            const reader = new FileReader();

            reader.readAsText(file);
            reader.onload = () => {
                setViewerData({
                    CPU: document.getElementById("selectcpu").value,
                    OC: document.getElementById("selectoc").value,
                    file: reader.result
                });
            }
        } else {
            document.querySelector(".reader").classList.remove("active");
            document.getElementById("message").innerText = "Invalid file type";
        }
    }

    return(
        <div 
            className="reader"
            onDragOver={event => {
                event.preventDefault();
                event.currentTarget.classList.add("active");
            }} 
            onDragLeave={event => {
                event.preventDefault();
                event.currentTarget.classList.remove("active");
            }}
            onDrop={event => {
                event.preventDefault();
                storeData(event.dataTransfer.files[0]);
            }}
        >
            <div className="select">
                <div className="cpu-arch">
                    <header>Choose your CPU architecture</header>
                    <select id="selectcpu" name="selectcpu" defaultValue="intelprd">
                        <option value="intelprd">Intel Desktop: Yonah, Conroe and Penryn</option>
                        <option value="intelcdd">Intel Desktop: Lynnfield and Clarkdale</option>
                        <option value="intelsbd">Intel Desktop: Sandy Bridge</option>
                        <option value="intelibd">Intel Desktop: Ivy Bridge</option>
                        <option value="intelhwd">Intel Desktop: Haswell and Broadwell</option>
                        <option value="intelsld">Intel Desktop: Skylake</option>
                        <option value="intelkld">Intel Desktop: Kaby Lake</option>
                        <option value="intelcfld">Intel Desktop: Coffee Lake</option>
                        <option value="intelcld">Intel Desktop: Comet Lake</option>
                        <option value="inteladl">Intel Laptop: Clarksfield and Arrandale</option>
                        <option value="intelsbl">Intel Laptop: Sandy Bridge</option>
                        <option value="intelibl">Intel Laptop: Ivy Bridge</option>
                        <option value="intelhwl">Intel Laptop: Haswell</option>
                        <option value="intelbwl">Intel Laptop: Broadwell</option>
                        <option value="intelsll">Intel Laptop: Skylake</option>
                        <option value="intelkll">Intel Laptop: Kaby Lake</option>
                        <option value="intelcfll">Intel Laptop: Coffee Lake and Whiskey Lake</option>
                        <option value="intelcll">Intel Laptop: Coffee Lake Plus and Comet Lake</option>
                        <option value="intelill">Intel Laptop: Ice Lake</option>
                        <option value="intelnh">Intel HEDT: Nehalem and Westmere</option>
                        <option value="intelibe">Intel HEDT: Sandy and Ivy Bridge-E</option>
                        <option value="intelhwe">Intel HEDT: Haswell-E</option>
                        <option value="intelbwe">Intel HEDT: Broadwell-E</option>
                        <option value="intelslx">Intel HEDT: Skylake-X/W and Cascade Lake-X/W</option>
                        <option value="amdfx">AMD Desktop: FX</option>
                        <option value="amdzen">AMD Desktop: Zen</option>
                    </select>
                </div>
                <div className="oc-version">
                    <header>Choose your OpenCore version</header>
                    <select id="selectoc" name="selectoc" defaultValue={defaultValue}>
                        {(() => {
                            let options = [];
                            
                            for (let major = 0; major <= 1; major++) {
                                const minorStart = major === 0 ? 7 : 0;
                                const minorEnd = major === 1 ? parseInt(defaultValue.split(".")[1]) : 9;
                                
                                for (let minor = minorStart; minor <= minorEnd; minor++) {
                                    const patchStart = (major === 0 && minor === 7) ? 3 : 0;
                                    const patchEnd = (major === 1 && minor === parseInt(defaultValue.split(".")[1])) ? parseInt(defaultValue.split(".")[2]) : 9;
                                    
                                    for (let patch = patchStart; patch <= patchEnd; patch++) {
                                        const value = `${major}.${minor}.${patch}`;
                                        if (value >= "0.7.3" && value <= defaultValue) {
                                            options.push(<option key={value} value={value}>{value}</option>);
                                        }
                                    }
                                }
                            }
                            
                            return options;
                        })()}
                    </select>
                </div>
            </div>
            <div className="input">
                <PlistFileIcon />
                <header>Drag &amp; Drop your config.plist</header>
                <span>OR</span>
                <button 
                    onClick={() => document.querySelector(".input").getElementsByTagName("input")[0].click()}
                >
                    Choose File
                </button>
                <input 
                    type="file" 
                    accept=".plist" 
                    onChange={event => storeData(event.currentTarget.files[0])}
                    hidden 
                />
                <p id="message" />
            </div>
        </div>
    );
}