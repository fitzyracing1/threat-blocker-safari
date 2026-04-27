import SafariServices

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        let request = context.inputItems[0] as? NSExtensionItem
        guard let message = request?.userInfo?[SFExtensionMessageKey] as? [String: Any] else {
            context.cancelRequest(withError: NSError(domain: "InvalidRequest", code: -1))
            return
        }
        
        if let action = message["action"] as? String {
            switch action {
            case "getStats":
                let response = ["success": true] as [String: Any]
                let responseItem = NSExtensionItem()
                responseItem.userInfo = [SFExtensionMessageKey: response]
                context.completeRequest(returningItems: [responseItem], completionHandler: nil)
            default:
                context.cancelRequest(withError: NSError(domain: "UnknownAction", code: -1))
            }
        }
    }
}
