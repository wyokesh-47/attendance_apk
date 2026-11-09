import {useEffect, useState} from 'react';
import {KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppTextInput, ErrorMessage, FieldLabel, PrimaryButton, colors} from './ui';
import {SelectionChip} from './ManagementControls';
import {approveWithAccess} from '@/services/managementRepository';
import {rpc} from '@/services/cloud';
import type {CloudClass, CloudDepartment, ManagedAccount} from '@/types/management';

export function ApprovalSheet({account, departments, classes, onClose, onApproved}: {
  account: ManagedAccount | null; departments: CloudDepartment[]; classes: CloudClass[];
  onClose: () => void; onApproved: () => void;
}) {
  const [role, setRole] = useState<'staff' | 'hod'>('staff');
  const [target, setTarget] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = account?.approval_status === 'pending';
  useEffect(() => {setRole(account?.role === 'hod' ? 'hod' : 'staff'); setTarget(''); setSearch(''); setError('');}, [account?.id]);
  async function approve() {
    if (!account || busy) return;
    setBusy(true); setError('');
    try {
      if (pending) await approveWithAccess(account.id, role, target);
      else {
        if (!target || account.approval_status !== 'approved' || !['staff','hod'].includes(account.role)) throw new Error('Select access for an approved Staff or HOD account.');
        await rpc('assign_access', {p_user: account.id, p_class: account.role === 'staff' ? target : null,
          p_department: account.role === 'hod' ? target : null, p_active: true});
      }
      onApproved();
    }
    catch (reason) {setError(reason instanceof Error ? reason.message : 'Could not approve this account.');}
    finally {setBusy(false);}
  }
  const options = (role === 'hod' ? departments.map((item) => ({id: item.id, label: item.name})) :
    classes.map((item) => ({id: item.id, label: `${item.departments.name} · Year ${item.study_year} · ${item.section}`})))
    .filter((item) => item.label.toLowerCase().includes(search.trim().toLowerCase()));
  return <Modal visible={Boolean(account)} animationType="slide" onRequestClose={() => {if (!busy) onClose();}}>
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Text style={styles.title}>{pending ? 'Approve account' : 'Assign account access'}</Text>
          <Text style={styles.name}>{account?.name}</Text>
          <Text style={styles.note}>{account?.email}</Text>
          <Text style={styles.note}>Account role: {account?.role === 'hod' ? 'HOD' : 'Staff'} · {pending ? 'Pending approval' : 'Approved'}</Text>
          <FieldLabel>Grant access as</FieldLabel>
          <View style={styles.wrap}>{(['staff','hod'] as const).map((value) => <SelectionChip key={value} label={value === 'hod' ? 'HOD' : 'Staff'} selected={role === value} disabled={busy || !pending}
            onPress={() => {setRole(value); setTarget(''); setError('');}} />)}</View>
          <FieldLabel>{role === 'hod' ? 'Assign a department' : 'Assign an initial class'}</FieldLabel>
          <AppTextInput value={search} onChangeText={setSearch} placeholder={role === 'hod' ? 'Search departments' : 'Search current-year classes'} editable={!busy} />
          <View style={styles.options}>{options.map((item) => <SelectionChip key={item.id} label={item.label} selected={target === item.id} disabled={busy}
            onPress={() => setTarget(item.id)} />)}</View>
          {!options.length ? <Text style={styles.note}>{role === 'hod' ? 'No matching departments.' : 'No matching current-year classes. Set up the academic year and classes first.'}</Text> : null}
          <Text style={styles.note}>{role === 'hod' ? 'The HOD can view and correct attendance only in the assigned department.' : 'Staff can mark attendance for the assigned class. Submitted records are locked.'}</Text>
          {error ? <ErrorMessage>{error}</ErrorMessage> : null}
          <PrimaryButton label={pending ? `Approve as ${role === 'hod' ? 'HOD' : 'Staff'}` : 'Save access assignment'} onPress={() => void approve()} disabled={!target || busy} loading={busy} />
          <SelectionChip label="Cancel" selected={false} onPress={onClose} disabled={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}
const styles = StyleSheet.create({safe: {flex: 1, backgroundColor: colors.background}, content: {padding: 24, gap: 16},
  title: {fontSize: 25, fontWeight: '800', color: colors.ink}, name: {fontSize: 18, fontWeight: '700', color: colors.ink},
  note: {fontSize: 14, lineHeight: 21, color: colors.muted}, wrap: {flexDirection: 'row', gap: 10}, options: {gap: 8},
});
