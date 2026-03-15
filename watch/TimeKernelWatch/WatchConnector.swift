import Foundation
import WatchConnectivity

struct WatchEvent: Identifiable, Codable {
    let id: String
    let title: String
    let type: String
    let startTime: String
    let endTime: String
    let color: String
}

class WatchConnector: NSObject, ObservableObject, WCSessionDelegate {
    @Published var todayEvents: [WatchEvent] = []
    @Published var monthlyPay: Int = 0
    @Published var monthlyHours: Double = 0

    override init() {
        super.init()
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
        }
    }

    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {}

    func session(
        _ session: WCSession,
        didReceiveApplicationContext applicationContext: [String: Any]
    ) {
        DispatchQueue.main.async {
            if let eventsData = applicationContext["todayEvents"] as? Data {
                self.todayEvents = (try? JSONDecoder().decode([WatchEvent].self, from: eventsData)) ?? []
            }
            if let pay = applicationContext["monthlyPay"] as? Int {
                self.monthlyPay = pay
            }
            if let hours = applicationContext["monthlyHours"] as? Double {
                self.monthlyHours = hours
            }
        }
    }

    func sendAddEventRequest(title: String, date: String, startTime: String, endTime: String) {
        guard WCSession.default.isReachable else { return }
        WCSession.default.sendMessage([
            "action": "addEvent",
            "title": title,
            "date": date,
            "startTime": startTime,
            "endTime": endTime,
        ], replyHandler: nil)
    }
}
