import SwiftUI

struct AddEventView: View {
    @EnvironmentObject var connector: WatchConnector
    @Environment(\.dismiss) var dismiss

    @State private var title = ""
    @State private var startTime = "09:00"
    @State private var endTime = "10:00"

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                TextField("タイトル", text: $title)
                    .textFieldStyle(.roundedBorder)

                HStack {
                    Text("開始")
                        .font(.caption)
                    Spacer()
                    TextField("09:00", text: $startTime)
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 80)
                }

                HStack {
                    Text("終了")
                        .font(.caption)
                    Spacer()
                    TextField("10:00", text: $endTime)
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 80)
                }

                Button("追加") {
                    let formatter = DateFormatter()
                    formatter.dateFormat = "yyyy-MM-dd"
                    let today = formatter.string(from: Date())

                    connector.sendAddEventRequest(
                        title: title,
                        date: today,
                        startTime: startTime,
                        endTime: endTime
                    )
                    dismiss()
                }
                .disabled(title.isEmpty)
                .buttonStyle(.borderedProminent)
            }
            .padding()
        }
        .navigationTitle("予定追加")
    }
}
