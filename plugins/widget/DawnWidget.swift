import WidgetKit
import SwiftUI

// Dawn 课程表 Widget 插件
// 说明：
// - 从 App Group 读取由主应用写入的 WidgetSnapshot JSON
// - 使用时间线策略每 30 分钟刷新一次，或由主应用触发主动刷新

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), snapshot: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), snapshot: loadSnapshot())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let currentDate = Date()
        let snapshot = loadSnapshot()
        
        // Refresh every 30 minutes or when app triggers reload
        let refreshDate = Calendar.current.date(byAdding: .minute, value: 30, to: currentDate)!
        
        let entry = SimpleEntry(date: currentDate, snapshot: snapshot)
        let timeline = Timeline(entries: [entry], policy: .after(refreshDate))
        completion(timeline)
    }
    
    // 从 App Group 读取快照并解码为 WidgetSnapshot
    private func loadSnapshot() -> WidgetSnapshot? {
        let userDefaults = UserDefaults(suiteName: "group.com.dawncourse.ios")
        if let data = userDefaults?.string(forKey: "widget_snapshot_v1")?.data(using: .utf8) {
            // 优先尝试按字符串 JSON 解码（与主应用写入方式一致）
            let decoder = JSONDecoder()
            return try? decoder.decode(WidgetSnapshot.self, from: data)
        }
        // 兼容：若以原始 Data 写入（未字符串化），则直接读取 data 解码
        if let data = userDefaults?.data(forKey: "widget_snapshot_v1") {
             let decoder = JSONDecoder()
             return try? decoder.decode(WidgetSnapshot.self, from: data)
        }
        return nil
    }
}

struct WidgetCourseItem: Codable, Identifiable {
    let id: String
    let name: String
    let location: String?
    let dayOfWeek: Int
    let startSection: Int
    let duration: Int
    let color: String?
    let startTime: String
    let endTime: String
}

struct WidgetSnapshot: Codable {
    let generatedAt: Double
    let currentWeek: Int
    let today: String
    let lastSuccessfulRefreshAt: Double
    let items: [WidgetCourseItem]
    let isSemesterEnded: Bool
    let emptyMessage: String?
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot?
}

struct DawnWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        // 根据不同尺寸的 Widget 使用不同布局
        switch family {
        case .systemSmall:
            SmallView(entry: entry)
        case .systemMedium:
            MediumView(entry: entry)
        case .systemLarge:
            LargeView(entry: entry)
        default:
            SmallView(entry: entry)
        }
    }
}

// MARK: - Views（不同尺寸的展示视图）

struct SmallView: View {
    var entry: Provider.Entry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if let snapshot = entry.snapshot {
                if let message = snapshot.emptyMessage {
                    EmptyStateView(message: message)
                } else if let firstItem = snapshot.items.first {
                    // 展示下一节课程的简要信息
                    Text(firstItem.name)
                        .font(.headline)
                        .lineLimit(2)
                        .foregroundColor(.primary)
                    
                    HStack {
                        Text(firstItem.startTime)
                            .font(.caption)
                            .fontWeight(.bold)
                        Text("-")
                        Text(firstItem.endTime)
                            .font(.caption)
                    }
                    .foregroundColor(.secondary)
                    
                    if let location = firstItem.location {
                        Text(location)
                            .font(.caption2)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                    
                    Spacer()
                    
                    FooterView(snapshot: snapshot)
                } else {
                    EmptyStateView(message: "今天没有课")
                }
            } else {
                EmptyStateView(message: "请打开 App 同步数据")
            }
        }
        .padding()
    }
}

struct MediumView: View {
    var entry: Provider.Entry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
             if let snapshot = entry.snapshot {
                 if let message = snapshot.emptyMessage {
                     EmptyStateView(message: message)
                 } else {
                     HStack(alignment: .top, spacing: 12) {
                         // 展示前两节课程
                         ForEach(snapshot.items.prefix(2)) { item in
                             VStack(alignment: .leading, spacing: 4) {
                                 Text(item.name)
                                     .font(.headline)
                                     .lineLimit(2)
                                 
                                 Text("\(item.startTime) - \(item.endTime)")
                                     .font(.caption)
                                     .foregroundColor(.secondary)
                                 
                                 if let location = item.location {
                                     Text(location)
                                         .font(.caption2)
                                         .foregroundColor(.secondary)
                                         .lineLimit(1)
                                 }
                             }
                             .frame(maxWidth: .infinity, alignment: .leading)
                             .padding(8)
                             .background(Color.secondary.opacity(0.1))
                             .cornerRadius(8)
                         }
                     }
                     Spacer()
                     FooterView(snapshot: snapshot)
                 }
             } else {
                 EmptyStateView(message: "请打开 App 同步数据")
             }
        }
        .padding()
    }
}

struct LargeView: View {
    var entry: Provider.Entry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let snapshot = entry.snapshot {
                 Text("今天课程")
                    .font(.headline)
                    .padding(.bottom, 4)
                
                 if let message = snapshot.emptyMessage {
                     EmptyStateView(message: message)
                 } else {
                     VStack(spacing: 8) {
                         // 列出最多 5 条课程项
                         ForEach(snapshot.items.prefix(5)) { item in
                             HStack {
                                 VStack(alignment: .leading) {
                                     Text(item.startTime)
                                         .font(.caption2)
                                         .foregroundColor(.secondary)
                                     Text(item.endTime)
                                         .font(.caption2)
                                         .foregroundColor(.secondary)
                                 }
                                 .frame(width: 40)
                                 
                                 VStack(alignment: .leading) {
                                     Text(item.name)
                                         .font(.subheadline)
                                         .lineLimit(1)
                                     if let location = item.location {
                                         Text(location)
                                             .font(.caption2)
                                             .foregroundColor(.secondary)
                                     }
                                 }
                                 Spacer()
                             }
                             .padding(4)
                             .background(Color.secondary.opacity(0.05))
                             .cornerRadius(4)
                         }
                     }
                     Spacer()
                     FooterView(snapshot: snapshot)
                 }
            } else {
                EmptyStateView(message: "请打开 App 同步数据")
            }
        }
        .padding()
    }
}

struct EmptyStateView: View {
    let message: String
    
    var body: some View {
        VStack {
            Spacer()
            Text(message)
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            Spacer()
        }
        .frame(maxWidth: .infinity)
    }
}

struct FooterView: View {
    let snapshot: WidgetSnapshot
    
    var body: some View {
        HStack {
            Text("第 \(snapshot.currentWeek) 周")
            Spacer()
            Text(snapshot.today)
        }
        .font(.caption2)
        .foregroundColor(.tertiaryLabel)
    }
}

@main
struct DawnWidget: Widget {
    let kind: String = "DawnWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            DawnWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("课程表")
        .description("查看今天的课程安排")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

extension Color {
    static let tertiaryLabel = Color(UIColor.tertiaryLabel)
}
