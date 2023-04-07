<h1 align="center">
  <br>
  <img src="https://raw.githubusercontent.com/velickovicdj/O3C/main/src/assets/logo.png" alt="O3C" width="100">
  <br>
  O3C - OpenCore Config Checker
  <br>
</h1>

<p align="center">
  O3C validates OpenCore config.plist files by marking individual properties of the config.plist with colored flags.
</p>

## How it works

When the user uploads their config.plist file, O3C uses the `plistParser` module to parse the data from the `config.plist` file. The `plistParser` module extracts the relevant data from the `config.plist` file and returns it as a JavaScript object.

`plistParser` also checks the validity of certain properties in the config.plist file by comparing them with the values listed in `<version>.plist` file, where `<version>` refers to the specific OpenCore version being used. If a property is missing from the `config.plist` file, `plistParser` adds it to an array of missing properties, which is returned to `Viewer.jsx` and rendered on top of the validation results.

The `<version>.plist` file has custom tags, which can be a sequence of possible CPU arch values concatenated. For example:

```xml
<key>DummyPowerManagement</key>
<false/>
<amdfxamdzen>
    <true/>
</amdfxamdzen>
```

Here if the selected CPU arch doesn't match `amdfx` or `amdzen` in `<amdfxamdzen>`, `plistParser` skips this tag, and the previous one is evaluated (`<false/>`).

## Custom tags and Properties

In addition to the standard properties that are found in the `config.plist`, O3C supports custom tags and properties to provide additional flexibility. These tags and properties are defined in the `comments.plist` and `<version>.plist` files located in the public directory, where `<version>` refers to the specific OpenCore version being used.

Some of the custom tags that are used by OpenCore include:

- `bold`: Used to display text in bold font
- `link`: Used to display text as a hyperlink
- `intelprd`: Used to display text for a specific CPU architecture

Custom properties can hold an array of possible values (mostly string values) so that the user hasn't set them to an invalid value. For example:

```xml
<key>SystemMemoryStatus</key>
<array>
    <string>Auto</string>
    <string>Upgradable</string>
    <string>Soldered</string>
</array>
```

Custom tags are used in the `comments.plist` to provide additional customization options but they can also be used conditionally, based on the selected CPU architecture and property value. For example:

```xml
<key>AppleXcpmCfgLock</key>
<dict>
    <key status="correct">YES</key>
    <string>If CFG-Lock is disabled in BIOS, you can disable this quirk.</string>
    <intelprd status="warning">
        <string>CFG-Lock is not present on Intel Penryn, so there's no need for this quirk to be enabled.</string>
    </intelprd>
</dict>
```

In this example, O3C will only show comments that apply to the selected architecture and only if the property value is set to "YES" (true).

## Contributing and Feedback

If you encounter any issues with O3C or have suggestions for improving it, please feel free to submit an issue on GitHub or contact me directly at <a href="mailto:djolevelicko@gmail.com">djolevelicko@gmail.com</a>. 

Your feedback is greatly appreciated and helps make O3C better for everyone. Contributions, such as code improvements or new features, are also welcomed and greatly appreciated. 

Thank you for using O3C!