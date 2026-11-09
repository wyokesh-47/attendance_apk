import {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {AppTextInput, ErrorMessage, FieldLabel, colors} from './ui';
import {shiftDate, validDate} from '@/services/managementRepository';

export function SelectionChip({label, selected, onPress, disabled}: {label: string; selected: boolean; onPress: () => void; disabled?: boolean}) {
  return <Pressable accessibilityRole="button" accessibilityState={{selected, disabled: Boolean(disabled)}} disabled={disabled}
    onPress={onPress} style={[styles.chip, selected && styles.selected, disabled && styles.disabled]}>
    <Text style={[styles.chipText, selected && styles.selectedText]}>{label}</Text>
  </Pressable>;
}
export function DateHourControls({date, hour, onChange, disabled = false}: {date: string; hour: number; onChange: (date: string, hour: number) => void; disabled?: boolean}) {
  const [input, setInput] = useState(date);
  const [error, setError] = useState('');
  useEffect(() => {setInput(date); setError('');}, [date]);
  function apply() {
    if (!validDate(input)) {setError('Enter a valid date as YYYY-MM-DD.'); return;}
    setError(''); onChange(input, hour);
  }
  return <View style={styles.controls}>
    <FieldLabel>Attendance date</FieldLabel>
    <View style={styles.dateRow}>
      <AppTextInput style={styles.dateInput} accessibilityLabel="Attendance date YYYY-MM-DD" value={input} onChangeText={setInput}
        editable={!disabled} autoCapitalize="none" placeholder="YYYY-MM-DD" maxLength={10} onSubmitEditing={apply} />
      <SelectionChip label="Apply" selected onPress={apply} disabled={disabled} />
    </View>
    {error ? <ErrorMessage>{error}</ErrorMessage> : null}
    <View style={styles.wrap}>
      <SelectionChip label="Previous day" selected={false} onPress={() => onChange(shiftDate(date, -1), hour)} disabled={disabled} />
      <SelectionChip label="Next day" selected={false} onPress={() => onChange(shiftDate(date, 1), hour)} disabled={disabled} />
    </View>
    <FieldLabel>Class hour</FieldLabel>
    <View style={styles.wrap}>{[1, 2, 3, 4, 5].map((value) => <SelectionChip key={value} label={`Hour ${value}`} selected={hour === value}
      disabled={disabled} onPress={() => onChange(date, value)} />)}</View>
  </View>;
}
export function AttendanceTotals({counts}: {counts: {total_students: number; present: number; absent: number; od: number; informed_leave: number; unmarked: number}}) {
  const items = [{label: 'Students', value: counts.total_students, color: colors.ink},
    {label: 'Present', value: counts.present, color: colors.green}, {label: 'Absent', value: counts.absent, color: '#B42318'},
    {label: 'OD', value: counts.od, color: '#805B13'}, {label: 'Informed Leave', value: counts.informed_leave, color: '#6941C6'},
    {label: 'Unmarked', value: counts.unmarked, color: colors.muted}];
  return <View style={styles.totals}>{items.map((item) => <View key={item.label} style={styles.total}>
    <Text style={[styles.totalValue, {color: item.color}]}>{item.value}</Text><Text style={styles.totalLabel}>{item.label}</Text>
  </View>)}</View>;
}
const styles = StyleSheet.create({controls: {gap: 10}, dateRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  dateInput: {flex: 1, minWidth: 0}, wrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {minHeight: 44, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, justifyContent: 'center'},
  selected: {backgroundColor: colors.green, borderColor: colors.green}, disabled: {opacity: 0.5},
  chipText: {fontSize: 13, lineHeight: 19, textAlign: 'center', fontWeight: '600', color: colors.ink}, selectedText: {color: colors.white},
  totals: {flexDirection: 'row', flexWrap: 'wrap', rowGap: 16, justifyContent: 'space-between'},
  total: {width: '30%', gap: 3}, totalValue: {fontSize: 23, lineHeight: 30, fontWeight: '800'}, totalLabel: {fontSize: 11, lineHeight: 16, color: colors.muted},
});
