import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const CalculatorApp: React.FC = () => {
  const [expression, setExpression] = useState<string>('');
  const [result, setResult] = useState<string>('0');
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    loadHistory();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadHistory = async (): Promise<void> => {
    try {
      const historyData = await AsyncStorage.getItem('calculatorHistory');
      if (historyData) {
        setHistory(JSON.parse(historyData));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const saveToHistory = async (calc: string): Promise<void> => {
    try {
      const newHistory = [calc, ...history.slice(0, 4)];
      setHistory(newHistory);
      await AsyncStorage.setItem('calculatorHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const handleNumberPress = (num: string): void => {
    setExpression((prev) => prev + num);
  };

  const handleOperatorPress = (operator: string): void => {
    if (expression === '' && operator !== '-') return;
    const lastChar = expression.slice(-1);
    if (['+', '-', '*', '/'].includes(lastChar)) {
      setExpression((prev) => prev.slice(0, -1) + operator);
    } else {
      setExpression((prev) => prev + operator);
    }
  };

  const handleAdvancedOperation = (operation: string): void => {
    let calculation = '';
    let resultValue = '';

    try {
      switch (operation) {
        case 'sqrt':
          resultValue = Math.sqrt(eval(expression)).toString();
          calculation = `√(${expression}) = ${resultValue}`;
          break;
        case 'power':
          resultValue = Math.pow(eval(expression), 2).toString();
          calculation = `(${expression})² = ${resultValue}`;
          break;
        case 'percentage':
          resultValue = (eval(expression) / 100).toString();
          calculation = `(${expression})% = ${resultValue}`;
          break;
      }

      if (calculation) {
        setResult(resultValue);
        saveToHistory(calculation);
        setExpression(resultValue);
      }
    } catch {
      setResult('Error');
    }
  };

  const calculateResult = (): void => {
    if (!expression) return;
    try {
      const sanitizedExpression = expression.replace(/[^0-9+\-*/().]/g, '');
      const calculationResult = eval(sanitizedExpression).toString();

      setResult(calculationResult);
      saveToHistory(`${expression} = ${calculationResult}`);
      setExpression(calculationResult);
    } catch {
      setResult('Error');
    }
  };

  const clearCalculator = (): void => {
    setExpression('');
    setResult('0');
  };

  const handleDelete = (): void => {
    setExpression((prev) => prev.slice(0, -1));
  };

  const toggleHistory = (): void => {
    setShowHistory((prev) => !prev);
  };

  const clearHistory = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('calculatorHistory');
      setHistory([]);
      Alert.alert('Success', 'History cleared!');
    } catch {
      Alert.alert('Error', 'Failed to clear history');
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.displayContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Text style={styles.expressionText}>{expression || '0'}</Text>
        </ScrollView>
        <Text style={styles.resultText}>{result}</Text>
      </View>

      <TouchableOpacity style={styles.historyButton} onPress={toggleHistory}>
        <Text style={styles.historyButtonText}>
          {showHistory ? '📟 Calculator' : '📊 History'}
        </Text>
      </TouchableOpacity>

      {showHistory ? (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Calculation History</Text>
          {history.length === 0 ? (
            <Text style={styles.noHistoryText}>No calculations yet</Text>
          ) : (
            <ScrollView style={styles.historyList}>
              {history.map((item, index) => (
                <View key={index} style={styles.historyItem}>
                  <Text style={styles.historyText}>{item}</Text>
                </View>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity style={styles.clearHistoryButton} onPress={clearHistory}>
            <Text style={styles.clearHistoryText}>Clear History</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttonsContainer}>
          {[
            ['⌫'],
            ['C', '√', '%', '÷'],
            ['7', '8', '9', '×'],
            ['4', '5', '6', '-'],
            ['1', '2', '3', '+'],
            ['x²', '0', '.', '='],
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((btn) => (
                <TouchableOpacity
                  key={btn}
                  style={[
                    styles.button,
                    btn === '='
                      ? styles.equalsButton
                      : ['+', '-', '×', '÷'].includes(btn)
                      ? styles.operatorButton
                      : ['√', '%', 'x²'].includes(btn)
                      ? styles.advancedButton
                      : btn === 'C'
                      ? styles.clearButton
                      : styles.numberButton,
                  ]}
                  onPress={() => {
                    if (btn === 'C') clearCalculator();
                    else if (btn === '⌫') handleDelete();
                    else if (btn === '=') calculateResult();
                    else if (['+', '-', '×', '÷'].includes(btn))
                      handleOperatorPress(btn === '×' ? '*' : btn === '÷' ? '/' : btn);
                    else if (['√', '%', 'x²'].includes(btn))
                      handleAdvancedOperation(
                        btn === '√'
                          ? 'sqrt'
                          : btn === 'x²'
                          ? 'power'
                          : btn === '%'
                          ? 'percentage'
                          : btn
                      );
                    else if (btn === '📊') toggleHistory();
                    else handleNumberPress(btn);
                  }}
                >
                  <Text style={styles.buttonText}>{btn}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  displayContainer: {
    backgroundColor: '#2d2d2d',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    minHeight: 120,
    justifyContent: 'flex-end',
  },
  expressionText: {
    color: '#888',
    fontSize: 24,
    textAlign: 'right',
  },
  resultText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 10,
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  button: {
    width: (width - 100) / 4,
    height: (width - 100) / 4,
    borderRadius: (width - 100) / 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButton: { backgroundColor: '#333' },
  operatorButton: { backgroundColor: '#ff9500' },
  advancedButton: { backgroundColor: '#a5a5a5' },
  clearButton: { backgroundColor: '#a5a5a5' },
  equalsButton: { backgroundColor: '#ff9500' },
  buttonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  historyButton: {
    backgroundColor: '#ff9500',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  historyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyContainer: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    borderRadius: 15,
    padding: 20,
  },
  historyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  historyList: { flex: 1 },
  historyItem: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  historyText: { color: '#fff', fontSize: 16 },
  noHistoryText: {
    color: '#888',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  clearHistoryButton: {
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  clearHistoryText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CalculatorApp;
