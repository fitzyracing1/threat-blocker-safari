import Cocoa
import SafariServices

@NSApplicationMain
class AppDelegate: NSObject, NSApplicationDelegate {
    @IBOutlet weak var window: NSWindow!

    func applicationDidFinishLaunching(_ aNotification: Notification) {
        SFSafariExtensionManager.getStateOfExtension(
            withIdentifier: "com.threatblocker.safari.extension",
            completionHandler: { state, error in
                DispatchQueue.main.async {
                    if let state = state {
                        print(state.isEnabled ? "✅ Extension enabled" : "⚠️ Enable in Safari")
                    }
                }
            }
        )
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}
