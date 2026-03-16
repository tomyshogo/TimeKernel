import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Linking,
} from 'react-native';
import { Card } from '../src/components/ui/Card';
import { Button } from '../src/components/ui/Button';

interface AssistantStatus {
  alexa: boolean;
  siri: boolean;
  google: boolean;
}

export default function VoiceAssistantScreen() {
  const [status, setStatus] = useState<AssistantStatus>({
    alexa: false,
    siri: false,
    google: false,
  });

  const assistants = [
    {
      key: 'alexa' as const,
      name: 'Amazon Alexa',
      description: 'Alexaスキルでスマートスピーカーから操作',
      commands: [
        '「アレクサ、今日の予定を教えて」',
        '「アレクサ、明日14時に歯医者を追加して」',
        '「アレクサ、今月のバイト代は？」',
      ],
    },
    {
      key: 'siri' as const,
      name: 'Siri',
      description: 'Siriショートカットで素早く操作',
      commands: [
        '「Hey Siri、今日の予定」',
        '「Hey Siri、次の予定は？」',
      ],
    },
    {
      key: 'google' as const,
      name: 'Google Assistant',
      description: 'Google Homeやスマホから操作',
      commands: [
        '「OK Google、今日の予定を教えて」',
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.description}>
          音声アシスタントと連携して、ハンズフリーで予定の確認・追加ができます。
        </Text>
      </Card>

      {assistants.map((assistant) => (
        <Card key={assistant.key}>
          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.name}>{assistant.name}</Text>
              <Text style={styles.desc}>{assistant.description}</Text>
            </View>
            <Switch
              value={status[assistant.key]}
              onValueChange={(v) =>
                setStatus((prev) => ({ ...prev, [assistant.key]: v }))
              }
              trackColor={{ false: '#e0e0e0', true: '#3498db' }}
            />
          </View>

          {status[assistant.key] && (
            <View style={styles.commands}>
              <Text style={styles.commandsTitle}>使えるコマンド:</Text>
              {assistant.commands.map((cmd, i) => (
                <Text key={i} style={styles.command}>{cmd}</Text>
              ))}
            </View>
          )}
        </Card>
      ))}

      <Card>
        <Text style={styles.note}>
          Alexa連携にはAmazonアカウントとのAccount Linkingが必要です。
          Siri連携はiOS設定のSiriショートカットから有効にできます。
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { paddingVertical: 8, paddingBottom: 40 },
  description: { fontSize: 14, color: '#7f8c8d', lineHeight: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: { flex: 1, marginRight: 12 },
  name: { fontSize: 16, fontWeight: '700', color: '#2c3e50' },
  desc: { fontSize: 13, color: '#7f8c8d', marginTop: 2 },
  commands: { marginTop: 12, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e0e0e0' },
  commandsTitle: { fontSize: 13, fontWeight: '600', color: '#2c3e50', marginBottom: 4 },
  command: { fontSize: 13, color: '#3498db', marginVertical: 2 },
  note: { fontSize: 12, color: '#95a5a6', lineHeight: 18 },
});
