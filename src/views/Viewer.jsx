import React from "react";
import plistParser from "../plistParser"
import { ReactComponent as StatusIcon } from "../assets/icons/status.svg";

export default class Viewer extends React.Component{
    state = {
        ocPlist: [],
        comments: [],
        userPlist: [],
        errors: [],
        statusColors: {
            correct: "#00e14b",
            warning: "#ffc328",
            error: "#ff2850",
            info: "#323cff"
        }
    }
    componentDidMount() {
        (async() => {
            try{
                const PUBLIC_URL = window.location.href;

                const sample_xml = await (await fetch(PUBLIC_URL+`/configs/${this.props.viewerData.OC.replace(/\./g, '')}.plist`)).text();
                const comments_xml = await (await fetch(PUBLIC_URL+"/comments.plist")).text();

                const samplePlistData = plistParser.parse(sample_xml, this.props.viewerData.CPU, false);
                const comments = plistParser.parse(comments_xml, this.props.viewerData.CPU, true);
                const userPlistData = plistParser.parse(this.props.viewerData.file, false);

                const errors = plistParser.validate(userPlistData, samplePlistData);

                this.setState({
                    ocPlist: samplePlistData,
                    comments: comments,
                    userPlist: userPlistData,
                    errors: errors
                });
            }catch(error) {
                this.setState({errors: [...this.state.errors, error]});
            }
        })();
    }
    print(key, {status, title, content}) {
        return(
            <div className="status">
                <StatusIcon style={{fill: this.state.statusColors[status]}} />
                <p key={key+(title?.split(":")[0] ?? (content.type || content.length))}>
                    {title && <strong>{title}</strong>}&nbsp;{content || ""}
                </p>
            </div>
        );
    }
    render() {
        return(
            <div className="viewer">
                <header>
                    <h1>{this.state.comments?.Link} OpenCore-{this.props.viewerData.OC} Sanity Check</h1>
                </header>
                <div className="errors">
                    {this.state.errors?.map((error, index) => this.print(index, {status: "error", content: error}))}
                </div>
                <div className="plist-data">
                    {this.state.ocPlist && (() => {
                        const { ocPlist, userPlist } = this.state;

                        let plistData = [];
                        let key = "";
                        
                        const push = entry => entry.type ? plistData.push(entry) : plistData.push(this.print(key, entry));

                        const humanize = array => [array.slice(0, -1).join(", "), array.slice(-1)[0]].join(array.length < 2 ? "" : " and ");

                        const commentate = (keys, _default) => {
                            const getComment = (comment, index) => {
                                return keys[index] in comment ? getComment(comment[keys[index]], index+1) : (comment.type && comment) || null;
                            }
                            const comment = getComment(this.state.comments, 0);

                            push({
                                status: comment?.props.status ?? _default.status,
                                title: _default.title,
                                content: comment ?? _default.content
                            });
                        }

                        for (const group in userPlist) {
                            key = group;
                            // At the top level, the first child of the <plist> tag is <dict> and when parsed with plistParser.js it becomes an object, so any type other than this shouldn't be there.
                            if (userPlist[group].constructor !== Object) {
                                push({
                                    status: "warning",
                                    title: group,
                                    content: "Remove this."
                                });
                                continue;
                            }

                            push(<h1 key={group}>{group}</h1>);

                            for (const section in userPlist[group]) {
                                if (section in ocPlist[group]) {
                                    // It can happen that in the same level we can have an object as well as other types. Here we make sure that they are differentiated.
                                    if (typeof userPlist[group][section] !== "object") {
                                        if (typeof ocPlist[group][section] === "object") {
                                            const isValueValid = ocPlist[group][section].includes(userPlist[group][section]);

                                            commentate([group, section], {
                                                status: isValueValid ? "correct" : "error",
                                                title: section+": "+userPlist[group][section],
                                                content: isValueValid ? "" : `This is an unsupported value. Supported values are: ${humanize(ocPlist[group][section])}.`
                                            });

                                            continue;
                                        }
                                        const isSectionDifferent = userPlist[group][section] !== ocPlist[group][section];

                                        commentate([group, section, userPlist[group][section]], {
                                            status: isSectionDifferent ? "warning" : "correct",
                                            title: section+": "+userPlist[group][section],
                                            content: isSectionDifferent ? <span>but should be <strong>{ocPlist[group][section]}</strong></span> : ""
                                        });
                                    } else {
                                        push(<h2 key={group+section}>{section}</h2>);

                                        if (userPlist[group][section].constructor === Array) {
                                            if ("AddToolsDrivers".indexOf(section) >- 1) {
                                                let info = [];

                                                for (const prop in ocPlist[group][section]) {
                                                    if (section !== "Tools") {
                                                        info.push(group+section === "KernelAdd" ? ocPlist[group][section][prop]["BundlePath"] : ocPlist[group][section][prop]["Path"]);
                                                    }
                                                }
                                                if (userPlist[group][section].length > 0) {
                                                    // Tools are not essential for basic functionality thus we ignore.
                                                    if (section !== "Tools") {
                                                        push({
                                                            status: "info",
                                                            content: `${humanize(info)} ${info.length>1 ? "are" : "is"} ${group === "ACPI" ? "recommended for your system" : "crucial"}.`
                                                        });
                                                    }

                                                    for (const prop in userPlist[group][section]) {
                                                        const validFileExtension = ((ocPlist[group][section][Object.keys(ocPlist[group][section])[0]]["Path"] || ocPlist[group][section][Object.keys(ocPlist[group][section])[0]]["BundlePath"]) || ".efi").split('.')[1];
                                                        const filePath = userPlist[group][section][prop]["Path"] || userPlist[group][section][prop]["BundlePath"] || userPlist[group][section][prop];

                                                        if (typeof filePath !== "string") {
                                                            continue;
                                                        }

                                                        if (typeof filePath === "undefined" || filePath.match(/\.[0-9a-z]+$/i) === null) {
                                                            push({
                                                                status: "error",
                                                                content: "You have an entry with an unspecified path at index "+prop
                                                            });
                                                            continue;
                                                        }
                                                        if (filePath.match(/[0-9a-z]+$/i)[0] !== validFileExtension) {
                                                            push({
                                                                status: "error",
                                                                title: filePath,
                                                                content: <span>Only include <strong>{validFileExtension}</strong> files here!</span>
                                                            });
                                                            continue;
                                                        }
                                                        if (section === "Drivers") {
                                                            // Checking if we are dealing with older OC versions.
                                                            if (typeof userPlist[group][section][prop] === "string") {
                                                                push({
                                                                    status: "error",
                                                                    content: "Driver entries of type string are used in OpenCore 0.7.2 and older!"
                                                                });
                                                                break;
                                                            } else {
                                                                const isFileDisabled = userPlist[group][section][prop].Enabled === "NO";

                                                                push({
                                                                    status: isFileDisabled ? "warning" : "correct",
                                                                    title: filePath,
                                                                    content: isFileDisabled ? "is disabled." : ""
                                                                });
                                                            }
                                                            continue;
                                                        }
                                                        const fileName = (filePath.split('/')[0].replace(/-/g, '')).toLowerCase();
                                                        const isFileDisabled = userPlist[group][section][prop].Enabled === "NO";

                                                        commentate([group, section, fileName], {
                                                            status: isFileDisabled ? "warning" : "correct",
                                                            title: filePath,
                                                            content: isFileDisabled ? "is disabled." : ""
                                                        });
                                                    }
                                                } else if (section !== "Tools") {
                                                    push({
                                                        status: "error", 
                                                        content: "Section is empty, you might want to add the following: " + humanize(info)
                                                    });
                                                }
                                            } else {
                                                // We only care if there are entries present in <0.X.X>.plist depending on the CPU Architecture.
                                                if (group in this.state.comments && section in this.state.comments[group]) {
                                                    push({
                                                        status: this.state.comments[group][section].props.status,
                                                        content: this.state.comments[group][section]
                                                    });
                                                }
                                                // const count = userPlist[group][section].length;
                                                
                                                if (ocPlist[group][section].length > 0) {
                                                    if (userPlist[group][section].length > 0) {
                                                        if (userPlist[group][section].length<ocPlist[group][section].length) {
                                                            push({
                                                                status: "warning",
                                                                content: userPlist[group][section].length+" entries found." + ocPlist[group][section].length
                                                            });
                                                        }
                                                    } else {
                                                        push({
                                                            status: "error", 
                                                            content: "0 entries found."
                                                        });
                                                    }
                                                }
                                            }
                                        } else {
                                            for (const prop in userPlist[group][section]) {
                                                if (typeof userPlist[group][section][prop] !== "object" && !(prop in ocPlist[group][section])) {
                                                    push({
                                                        status: "warning",
                                                        title: prop,
                                                        content: "There is no schema for this key, check your OpenCore version."
                                                    });
                                                    continue;
                                                }
                                                if (typeof userPlist[group][section][prop] === "object") {
                                                    // Special case
                                                    if (group+section === "NVRAMAdd") {
                                                        for (const child in userPlist[group][section][prop]) {
                                                            if (child in ocPlist[group][section][prop]) {
                                                                if (userPlist[group][section][prop][child] !== ocPlist[group][section][prop][child]) {
                                                                    commentate([group, section, child], {
                                                                        status: "warning",
                                                                        title: child+": "+userPlist[group][section][prop][child],
                                                                        content: <span>but should be <strong>{ocPlist[group][section][prop][child]}</strong></span>
                                                                    });     
                                                                }                                                              
                                                                else {
                                                                    push({
                                                                        status: "correct",
                                                                        title: child+": "+userPlist[group][section][prop][child],
                                                                    });
                                                                }
                                                            } else {
                                                                push({
                                                                    status: "warning",
                                                                    title: child,
                                                                    content: "There is no schema for this key, check your OpenCore version."
                                                                });
                                                            }
                                                        }
                                                    }
                                                    if (group+section === "DevicePropertiesAdd") {
                                                        const tmp = Object.keys(ocPlist[group][section]);

                                                        if (tmp.length > 0) {
                                                            const DevicePropertiesLink = <a href={`${this.state.comments.Link.props.href}#deviceproperties`}>OpenCore DeviceProperties</a>;
                                                            if (tmp.includes(prop)) {
                                                                for (const child in ocPlist[group][section][prop]) {
                                                                    if (child in userPlist[group][section][prop]) {
                                                                        const isValueCorrect = ocPlist[group][section][prop][child].includes(userPlist[group][section][prop][child].toUpperCase());

                                                                        push({
                                                                            status: isValueCorrect ? "correct" : "warning",
                                                                            title: child+": "+userPlist[group][section][prop][child],
                                                                            content: isValueCorrect ? "" : <span>This is may not be a correct value for your system. See {DevicePropertiesLink}.</span>
                                                                        });
                                                                    } else {
                                                                        push({
                                                                            status: "warning",
                                                                            title: child,
                                                                            content: <span>property is missing, but probably required for your system. See {DevicePropertiesLink}.</span>
                                                                        });
                                                                    }
                                                                }
                                                            } else {
                                                                tmp.map(sec => !(sec in userPlist[group][section]) && push({
                                                                    status: "warning",
                                                                    title: sec,
                                                                    content: <span>section is missing, but probably required for your system. See {DevicePropertiesLink}.</span>
                                                                }));
                                                            }
                                                        }
                                                    }
                                                } else {
                                                    if (group+section === "PlatformInfoGeneric") {
                                                        if (prop === "MLB" || prop === "ROM" || prop.indexOf("System") >- 1) {
                                                            if (prop === "SystemMemoryStatus") {
                                                                const isValueValid = ocPlist[group][section][prop].includes(userPlist[group][section][prop]);

                                                                push({
                                                                    status: isValueValid ? "correct" : "error",
                                                                    title: prop+": "+userPlist[group][section][prop],
                                                                    content: isValueValid ? "" : `This is an unsupported value. Supported values are: ${humanize(ocPlist[group][section][prop])}.`
                                                                });
                                                                continue;
                                                            }
                                                            const PlatformInfoLink = <a href={`${this.state.comments.Link.props.href}#platforminfo`}>OpenCore PlatformInfo</a>;
                                                            
                                                            if (prop === "SystemProductName") {
                                                                // SystemProductName is of type Array in our custom plist.
                                                                const isValueCorrect = ocPlist[group][section][prop].includes(userPlist[group][section][prop]);

                                                                push({
                                                                    status: isValueCorrect ? "correct" : "warning",
                                                                    title: prop+": "+userPlist[group][section][prop],
                                                                    content: isValueCorrect ? ocPlist[group][section][prop][userPlist[group][section][prop]]
                                                                    : <span>This is not recommended SMBIOS for your system. See {PlatformInfoLink}.</span>
                                                                });
                                                                continue;
                                                            }
                                                            const consecRegex = /(.)\1\1\1/;

                                                            if (userPlist[group][section][prop].length < ocPlist[group][section][prop].length
                                                                || consecRegex.test(userPlist[group][section][prop])) {                                                                
                                                                push({
                                                                    status: "error",
                                                                    title: prop,
                                                                    content: <span>is not set{userPlist[group][section][prop] === "*blank*" ? ". " : " properly. "}
                                                                    See {PlatformInfoLink}.</span>
                                                                });
                                                            } else {
                                                                push({
                                                                    status: "correct",
                                                                    title: prop,
                                                                    content: "is set."
                                                                });
                                                            }
                                                        }
                                                        continue;
                                                    }
                                                    if (typeof ocPlist[group][section][prop] === "object") {
                                                        const isValueValid = ocPlist[group][section][prop].includes(userPlist[group][section][prop]);

                                                        commentate([group, section, prop, userPlist[group][section][prop]], {
                                                            status: isValueValid ? "correct" : "error",
                                                            title: prop+": "+userPlist[group][section][prop],
                                                            content: isValueValid ? "" : `This is an unsupported value. ${ocPlist[group][section][prop].length < 6 
                                                                ? ("Supported values are: "+humanize(ocPlist[group][section][prop])) : ""}`
                                                        });
                                                        continue;
                                                    }
                                                    const isPropDifferent = userPlist[group][section][prop] !== ocPlist[group][section][prop];

                                                    commentate([group, section, prop, userPlist[group][section][prop]], {
                                                        status: isPropDifferent ? "warning" : "correct",
                                                        title: prop+": "+userPlist[group][section][prop],
                                                        content: isPropDifferent ? <span>but should be <strong>{ocPlist[group][section][prop]}</strong></span> : ""
                                                    });
                                                }
                                            }
                                        }
                                    }
                                } else if (typeof userPlist[group][section] !== "object") {
                                    push({
                                        status: "warning",
                                        title: section,
                                        content: "There is no schema for this key, check your OpenCore version."
                                    });
                                }
                            }
                        }
                        return plistData;
                    })()}
                </div>
            </div>
        );
    }
}