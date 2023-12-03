/**
  GptTeacher is a chat bot acts as language teacher to interact with us in the target language
  to improve the comprehension understanding.
 */

import React, {useRef, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Button,
  TextInput,
} from 'react-native';
import axios from 'axios';
import Config from 'react-native-config';
import {Colors} from 'react-native/Libraries/NewAppScreen';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

const INSTRUCTION = `You are a Finnish language teacher. Given the following topics (separated by comma): Healthcare, Family, Environment,
Work, News, Media, Housing.

Pick randomly one from the topics above and start a conversation (in Finnish) with the students.
`;

const FIRST_ASK =
  "Let's start by asking me a question (in Finnish) in a random topic described above";

const TEACHER = 1;
const STUDENT = 0;

// message type to send to API
type GptPrompt = {
  role: string;
  content: string;
};

/**
 * Send prompts to OpenAI API
 *
 * @return the response message (with role and content) or null
 */
const sendPrompts = async (messages: GptPrompt[]) => {
  const response = await axios.post(
    OPENAI_URL,
    {
      model: 'gpt-3.5-turbo',
      temperature: 1,
      messages,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Config.REACT_APP_OPENAI_KEY}`,
      },
    },
  );

  return response.data.choices?.[0]?.message;
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    justifyContent: 'center',
  },
  main: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 12,
  },
  messageItem: {
    padding: 12,
    flexDirection: 'column',
  },
  prefix: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  message: {
    fontSize: 16,
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const [prompts, setPrompts] = useState<GptPrompt[]>([
    {role: 'system', content: INSTRUCTION},
    {role: 'user', content: FIRST_ASK},
  ]);

  const [text, onChangeText] = useState('');

  const handleStart = async () => {
    const prompt = await sendPrompts(prompts);

    prompt && setPrompts([...prompts, prompt]);
  };

  const handlePress = async () => {
    const userPrompt = {
      role: 'user',
      content: text, // 'text' is user input
    };

    onChangeText(''); // reset the input
    const newPrompts = [...prompts, userPrompt];

    setPrompts(newPrompts);
    const agentPrompt = await sendPrompts(newPrompts);

    agentPrompt && setPrompts([...newPrompts, agentPrompt]);
  };

  let scrollViewRef = useRef<ScrollView>(null);

  const messages = prompts
    .slice(2)
    .map(({role, content}) => [
      role === 'user' ? STUDENT : TEACHER,
      content.replace(/^Assistant: /gi, ''),
    ]);

  const isStarted = messages.length > 0;

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <View style={styles.container}>
        {!isStarted && <Button title="Let's start" onPress={handleStart} />}

        {isStarted && (
          <>
            <Text style={styles.title}>GPT Teacher</Text>
            <ScrollView
              style={styles.main}
              ref={scrollViewRef}
              onContentSizeChange={() =>
                scrollViewRef?.current?.scrollToEnd({animated: true})
              }>
              {messages.map(([role, message], index) => (
                <View style={styles.messageItem} key={index}>
                  <Text style={styles.message}>
                    <Text style={styles.prefix}>
                      {role === STUDENT ? 'Me: ' : 'Teacher: '}
                    </Text>{' '}
                    {message}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <TextInput
              style={styles.input}
              onChangeText={onChangeText}
              placeholder="Reply here..."
              value={text}
            />
            <Button title="Answer" onPress={handlePress} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

export default App;
