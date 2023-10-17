import React from "react";
import cpu_arch_list from "../cpuArchList";
import { ReactComponent as PlistFileIcon } from "../assets/icons/plist.svg";

export default function Reader({ setViewerData }) {
    const defaultOCValue = "0.9.5";
    const defaultCpuArch = localStorage.getItem("default-cpu-arch") ?? "intelprd";

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
                    <select id="selectcpu" name="selectcpu" defaultValue={defaultCpuArch} style={{ width: "100%" }}>
                        {cpu_arch_list.map(cpu => <option key={cpu.value} value={cpu.value}>{cpu.text}</option>)}
                    </select>
                </div>
                <div className="oc-version">
                    <header>Choose your OpenCore version</header>
                    <select id="selectoc" name="selectoc" defaultValue={defaultOCValue}>
                        {(() => {
                            let options = [];
                            
                            for (let major = 0; major <= 1; major++) {
                                const minorStart = major === 0 ? 7 : 0;
                                const minorEnd = major === 1 ? parseInt(defaultOCValue.split(".")[1]) : 9;
                                
                                for (let minor = minorStart; minor <= minorEnd; minor++) {
                                    const patchStart = (major === 0 && minor === 7) ? 3 : 0;
                                    const patchEnd = (major === 1 && minor === parseInt(defaultOCValue.split(".")[1])) ? parseInt(defaultOCValue.split(".")[2]) : 9;
                                    
                                    for (let patch = patchStart; patch <= patchEnd; patch++) {
                                        const value = `${major}.${minor}.${patch}`;
                                        if (value >= "0.7.3" && value <= defaultOCValue) {
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