import { Buffer } from "buffer";

const cpu_arch_list = ["intelprd", "intelcdd", "intelsbd", "intelibd", "intelhwd", "intelsld", "intelkld", "intelcfld", "intelcld", "inteladl", "intelsbl", "intelibl", "intelhwl", "intelbwl", "intelsll", "intelkll", "intelcfl", "intelcll", "intelill", "intelnh", "intelibe", "intelhwe", "intelbwe", "intelslx", "amdfx", "amdzen"];
let cpu_arch = "";
let comments = false;

const plistParser = {
	whiteSpace: string => {
		return string.trim().length === 0 ? "*blank*" : string;
	},
	JSON: xml_node => {
		if (typeof xml_node === "undefined") {
			return;
		}

		let child_nodes = [];

		for(const child of xml_node.childNodes) {
			if (child.nodeName !== "#text") {
				child_nodes.push(child);
			}
		}

		switch(xml_node.nodeName) {
			case "plist":
				return plistParser.JSON(child_nodes[0]);

			case "dict":
				let dict = {};
				let key;
				
				for (const child of child_nodes) {
					if (child.nodeName === "#text") {
						continue;
					}
					
					if (cpu_arch_list.some(cpu => child.nodeName.indexOf(cpu) > -1)) {
						if (cpu_arch && child.nodeName.indexOf(cpu_arch) > -1) {
							for (const grandchild of child.childNodes) {
								if (grandchild.nodeName === "#text") {
									continue;
								}
								if (grandchild.nodeName === "key") {
									key = grandchild.firstChild.textContent;
								}
								dict[key] = plistParser.JSON(grandchild);
							}
							continue;
						} else {
							continue;
						}
					}
					
					if (child.nodeName === "key") {
						key = child.firstChild.textContent;
					}
					
					dict[key] = plistParser.JSON(child);
				}
				
				return dict;				

			case "array":
				let array = [];

				for (const child of child_nodes) {
					if (cpu_arch_list.some(cpu => child.nodeName.indexOf(cpu) > -1)) {
						if (cpu_arch && child.nodeName.indexOf(cpu_arch) > -1) {
							for (const grandchild of child.childNodes) {
								if (grandchild.nodeName !== "#text") {
									array.push(plistParser.JSON(grandchild));
								}
							}
						} else {
							continue;
						}
					} else {
						array.push(plistParser.JSON(child));
					}
				}

				return array;

			case "string":
				if (comments) {
					const status = xml_node.previousElementSibling?.getAttribute("status") ?? xml_node.parentNode.getAttribute("status");
					
					if (child_nodes.length > 0) {
						const comment = [];
						for (const child of xml_node.childNodes) {
							if (child.nodeName !== "#text") {
								comment.push(plistParser.JSON(child));
							} else {
								comment.push(child.textContent);
							}
						}
						return (
							<span status={status}>
								{comment}
							</span>
						);
					}
					
					return <span status={status}>{xml_node.textContent}</span>;
				}
				  
				return plistParser.whiteSpace(xml_node.textContent);				  

			case "integer":
				return plistParser.whiteSpace(xml_node.textContent);

			case "data":
				const base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
				const string_value = plistParser.whiteSpace(xml_node.textContent);

				if (base64Regex.test(string_value)) {
					try {
						const hex_value = Buffer.from(string_value, "base64").toString("hex");
						if (xml_node.previousElementSibling.textContent === "prev-lang:kbd") {
							return Buffer.from(hex_value, "hex").toString("ascii");
						} else {
							return hex_value;
						}
					} catch (error) {
						return string_value;
					}
				} else {
					return string_value;
				}
				  
			// Since most people are more familiar with the terms from Dortania guide and ProperTree, we will display booleans in the same manner.
			case "true":
				return "YES";

			case "false":
				return "NO";
			// Special tags used in comments.plist
			case "bold":
				if (comments) return <strong key={xml_node.textContent}>{xml_node.textContent}</strong>;
				break;

			case "link":
				if (comments) return <a key={xml_node.textContent} href={xml_node.getAttribute("href")}>{xml_node.textContent}</a>;
				break;

			default: return undefined;
		}
	},
	validate: (user_plist, sample_plist) => {
		let error_array = [];

		if (typeof user_plist === "undefined") {
			error_array.push(<span>Your plist file has some syntax issues and will not parse.</span>);

			return error_array;
		}

		for (const group in sample_plist) {
			if (typeof sample_plist[group] !== "object") {
				continue;
			}

			if (!(group in user_plist)) {
				error_array.push(<span><strong>{group}</strong> group is missing.</span>);
				continue;
			}

			for (const section in sample_plist[group]) {
				if (!(section in user_plist[group])) {
					error_array.push(<span><strong>{group} -{'>'} {section}</strong> section is missing.</span>);
					continue;
				}

				for (const prop in sample_plist[group][section]) {
					if (typeof user_plist[group][section] !== "object") {
						continue;
					}
					if (Array.isArray(sample_plist[group][section])) {
						if (!Array.isArray(user_plist[group][section])) {
							error_array.push(
								<span>
									<strong>{group} -{'>'} {section} </strong> 
									is of type <strong>object</strong> but should be of type <strong>array</strong>.
								</span>
							);
						}
						else {
							const prop_name = Object.keys(sample_plist[group][section][prop])[0];
							const prop_value = Object.values(sample_plist[group][section][prop])[0];

							if (!(user_plist[group][section].hasOwnProperty(prop))) {
								if(group !== "ACPI" && section !== "Tools") {
									error_array.push(<span><strong>{prop_value}</strong> is missing in the <strong>{group} -{'>'} {section}</strong> section, which is a crucial component.</span>);
								}
								continue;
							}


							if (!(prop_name in user_plist[group][section][prop])) {
								error_array.push(<span><strong>{group} -{'>'} {section} -{'>'} {prop_name}</strong> key is missing.</span>);
								continue;
							} else if (section === "Add") {
								const exists = Object.values(user_plist[group][section]).some(obj => obj.hasOwnProperty(prop_name) && obj[prop_name] === sample_plist[group][section][prop][prop_name]);

								if(!exists && group !== "ACPI" && section !== "Tools") {
									error_array.push(<span><strong>{prop_value}</strong> is missing in the <strong>{group} -{'>'} {section}</strong> section, which is a crucial component.</span>);						
								}
							}
						}
					}
					else if (!(prop in user_plist[group][section])) {
						if (group !== "DeviceProperties") {
							error_array.push(<span><strong>{group} -{'>'} {section} -{'>'} {prop}</strong> key is missing.</span>);
						}
					}
				}
			}
		}

		return error_array;

	},
	parse: (xml_plist, _cpu_arch, _comments) => {
		xml_plist = new DOMParser().parseFromString(xml_plist, "text/xml");

		cpu_arch = _cpu_arch;
		comments = _comments;

		return plistParser.JSON(xml_plist.getElementsByTagName("plist")[0]);;
	}
}

export default plistParser;