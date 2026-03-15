import SwiftUI

struct ContentView: View {
    @EnvironmentObject var connector: WatchConnector

    var body: some View {
        NavigationView {
            List {
                Section("今日の予定") {
                    if connector.todayEvents.isEmpty {
                        Text("予定なし")
                            .foregroundColor(.secondary)
                    } else {
                        ForEach(connector.todayEvents) { event in
                            HStack {
                                Circle()
                                    .fill(Color(hex: event.color))
                                    .frame(width: 8, height: 8)
                                VStack(alignment: .leading) {
                                    Text(event.title)
                                        .font(.caption)
                                        .fontWeight(.semibold)
                                    Text("\(event.startTime) - \(event.endTime)")
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                    }
                }

                Section("今月のバイト代") {
                    VStack(alignment: .leading) {
                        Text("\(connector.monthlyPay)円")
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                        Text("\(String(format: "%.1f", connector.monthlyHours))時間")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                NavigationLink(destination: AddEventView()) {
                    Label("予定を追加", systemImage: "plus.circle")
                }
            }
            .navigationTitle("TimeKernel")
        }
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        let scanner = Scanner(string: hex)
        var rgbValue: UInt64 = 0
        scanner.scanHexInt64(&rgbValue)
        let r = Double((rgbValue & 0xFF0000) >> 16) / 255.0
        let g = Double((rgbValue & 0x00FF00) >> 8) / 255.0
        let b = Double(rgbValue & 0x0000FF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}
