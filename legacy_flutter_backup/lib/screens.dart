import 'package:flutter/material.dart';

import 'demo_repository.dart';

const _ink = Color(0xFF182A24);
const _muted = Color(0xFF66736D);
const _green = Color(0xFF176B56);
const _line = Color(0xFFEAECF0);

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.repository});

  final AttendanceRepository repository;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController(text: 'staff@demo.edu');
  final _passwordController = TextEditingController(text: 'demo1234');
  bool _isRegistering = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _continue() {
    if (!_formKey.currentState!.validate()) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) => HomeScreen(repository: widget.repository),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 430),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const _BrandMark(size: 62),
                  const SizedBox(height: 28),
                  Text(
                    _isRegistering ? 'Create staff account' : 'Welcome back',
                    style: const TextStyle(
                      color: _ink,
                      fontSize: 30,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.8,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _isRegistering
                        ? 'Set up a demo profile to explore the staff app.'
                        : 'Sign in to manage today’s class attendance.',
                    style: const TextStyle(color: _muted, fontSize: 15),
                  ),
                  const SizedBox(height: 24),
                  const _DemoBanner(
                    text: 'DEMO MODE · No real account or student data',
                  ),
                  const SizedBox(height: 24),
                  Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (_isRegistering) ...[
                          const _FieldLabel('Full name'),
                          TextFormField(
                            controller: _nameController,
                            textCapitalization: TextCapitalization.words,
                            decoration: const InputDecoration(
                              hintText: 'Your demo display name',
                              prefixIcon: Icon(Icons.person_outline),
                            ),
                            validator: (value) => value == null ||
                                    value.trim().isEmpty
                                ? 'Enter a display name'
                                : null,
                          ),
                          const SizedBox(height: 16),
                        ],
                        const _FieldLabel('Staff email'),
                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(
                            hintText: 'name@example.com',
                            prefixIcon: Icon(Icons.mail_outline),
                          ),
                          validator: (value) => value == null ||
                                  !value.contains('@')
                              ? 'Enter a valid demo email'
                              : null,
                        ),
                        const SizedBox(height: 16),
                        const _FieldLabel('Password'),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          decoration: InputDecoration(
                            hintText: 'Enter any demo password',
                            prefixIcon: const Icon(Icons.lock_outline),
                            suffixIcon: IconButton(
                              onPressed: () => setState(
                                () => _obscurePassword = !_obscurePassword,
                              ),
                              icon: Icon(_obscurePassword
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined),
                            ),
                          ),
                          validator: (value) => value == null ||
                                  value.trim().length < 4
                              ? 'Use at least 4 characters'
                              : null,
                        ),
                        const SizedBox(height: 24),
                        FilledButton(
                          onPressed: _continue,
                          style: FilledButton.styleFrom(
                            minimumSize: const Size.fromHeight(54),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(15),
                            ),
                          ),
                          child: Text(_isRegistering
                              ? 'Create demo account'
                              : 'Sign in to demo'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextButton(
                    onPressed: () => setState(
                      () => _isRegistering = !_isRegistering,
                    ),
                    child: Text(_isRegistering
                        ? 'Already have a demo profile? Sign in'
                        : 'New staff member? Create a demo profile'),
                  ),
                  const SizedBox(height: 14),
                  const Center(
                    child: Text(
                      'Prototype only  ·  Authentication is not connected',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: _muted, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key, required this.repository});

  final AttendanceRepository repository;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const _BrandMark(compact: true),
        actions: [
          IconButton(
            tooltip: 'Staff profile',
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute<void>(
                builder: (_) => ProfileScreen(repository: repository),
              ),
            ),
            icon: const CircleAvatar(
              radius: 18,
              backgroundColor: Color(0xFFE5F3EE),
              child: Icon(Icons.person_outline, color: _green, size: 20),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 30),
          children: [
            const Text(
              'Good morning,',
              style: TextStyle(color: _muted, fontSize: 16),
            ),
            const SizedBox(height: 3),
            const Text(
              'Demo Staff',
              style: TextStyle(
                color: _ink,
                fontSize: 30,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.8,
              ),
            ),
            const SizedBox(height: 18),
            const _DemoBanner(
              text: 'DEMO DATA · Fictional students for testing only',
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: _green,
                borderRadius: BorderRadius.circular(22),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.fact_check_outlined,
                      color: Colors.white, size: 25),
                  SizedBox(height: 17),
                  Text(
                    'Attendance, made simple.',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 21,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  SizedBox(height: 5),
                  Text(
                    'Choose a department and class to get started.',
                    style: TextStyle(color: Color(0xFFD8EEE6), fontSize: 14),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 26),
            const Row(
              children: [
                Expanded(
                  child: Text(
                    'Departments',
                    style: TextStyle(
                      color: _ink,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                Text(
                  '7 available',
                  style: TextStyle(color: _muted, fontSize: 13),
                ),
              ],
            ),
            const SizedBox(height: 13),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: departments.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                mainAxisExtent: 118,
              ),
              itemBuilder: (context, index) {
                final department = departments[index];
                return _DepartmentTile(
                  department: department,
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute<void>(
                      builder: (_) => DepartmentClassesScreen(
                        department: department,
                        repository: repository,
                      ),
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 20),
            const Center(
              child: Text(
                'First Year · Second Year · Third Year',
                style: TextStyle(color: _muted, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class DepartmentClassesScreen extends StatelessWidget {
  const DepartmentClassesScreen({
    super.key,
    required this.department,
    required this.repository,
  });

  final Department department;
  final AttendanceRepository repository;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(department.name)),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'Choose a year',
            style: TextStyle(
              color: _ink,
              fontSize: 25,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Each class contains its own fictional demo roster.',
            style: TextStyle(color: _muted, fontSize: 14),
          ),
          const SizedBox(height: 18),
          for (var year = 1; year <= 3; year++) ...[
            _YearTile(
              classroom: Classroom(department: department, year: year),
              count: repository
                  .studentsFor(Classroom(department: department, year: year))
                  .length,
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute<void>(
                  builder: (_) => HourSelectionScreen(
                    classroom: Classroom(department: department, year: year),
                    repository: repository,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
          const SizedBox(height: 6),
          const _DemoBanner(text: 'DEMO DATA · Not actual college records'),
        ],
      ),
    );
  }
}

class HourSelectionScreen extends StatefulWidget {
  const HourSelectionScreen({
    super.key,
    required this.classroom,
    required this.repository,
  });

  final Classroom classroom;
  final AttendanceRepository repository;

  @override
  State<HourSelectionScreen> createState() => _HourSelectionScreenState();
}

class _HourSelectionScreenState extends State<HourSelectionScreen> {
  final Map<String, Future<Map<String, AttendanceStatus>>> _attendance = {};

  Future<Map<String, AttendanceStatus>> _forHour(String hour) =>
      _attendance.putIfAbsent(
        hour,
        () => widget.repository.attendanceFor(widget.classroom, hour),
      );

  void _refresh() {
    setState(() {
      _attendance.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final count = widget.repository.studentsFor(widget.classroom).length;
    return Scaffold(
      appBar: AppBar(title: const Text('Select an hour')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            widget.classroom.label,
            style: const TextStyle(
              color: _ink,
              fontSize: 24,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            '$count fictional students · Choose one of five hours',
            style: const TextStyle(color: _muted, fontSize: 14),
          ),
          const SizedBox(height: 20),
          for (final hour in hourLabels) ...[
            FutureBuilder<Map<String, AttendanceStatus>>(
              future: _forHour(hour),
              builder: (context, snapshot) {
                final marked = snapshot.data?.length ?? 0;
                return _HourTile(
                  hour: hour,
                  marked: marked,
                  total: count,
                  onTap: () async {
                    await Navigator.push<void>(
                      context,
                      MaterialPageRoute<void>(
                        builder: (_) => AttendanceScreen(
                          classroom: widget.classroom,
                          hour: hour,
                          repository: widget.repository,
                        ),
                      ),
                    );
                    _refresh();
                  },
                );
              },
            ),
            const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }
}

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({
    super.key,
    required this.classroom,
    required this.hour,
    required this.repository,
  });

  final Classroom classroom;
  final String hour;
  final AttendanceRepository repository;

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  final _searchController = TextEditingController();
  List<DemoStudent> _students = [];
  Map<String, AttendanceStatus> _statuses = {};
  bool _loading = true;
  bool _saving = false;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _load();
    _searchController.addListener(() {
      setState(() => _query = _searchController.text.trim().toLowerCase());
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final students = widget.repository.studentsFor(widget.classroom);
      final statuses =
          await widget.repository.attendanceFor(widget.classroom, widget.hour);
      if (!mounted) return;
      setState(() {
        _students = students;
        _statuses = statuses;
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() => _loading = false);
      _showMessage('Could not load demo attendance: $error');
    }
  }

  Future<void> _chooseStatus(DemoStudent student) async {
    final selected = await showModalBottomSheet<AttendanceStatus>(
      context: context,
      showDragHandle: true,
      backgroundColor: Colors.white,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                student.name,
                style: const TextStyle(
                  color: _ink,
                  fontSize: 19,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(student.registerNumber,
                  style: const TextStyle(color: _muted, fontSize: 12)),
              const SizedBox(height: 14),
              for (final status in AttendanceStatus.values)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: _StatusIcon(status: status),
                  title: Text(status.label),
                  trailing: _statuses[student.registerNumber] == status
                      ? const Icon(Icons.check_circle, color: _green)
                      : null,
                  onTap: () => Navigator.pop(context, status),
                ),
            ],
          ),
        ),
      ),
    );
    if (selected == null) return;
    await _saveStatus(student.registerNumber, selected);
  }

  Future<void> _saveStatus(String registerNumber, AttendanceStatus status) async {
    try {
      await widget.repository
          .setStatus(widget.classroom, widget.hour, registerNumber, status);
      if (mounted) setState(() => _statuses[registerNumber] = status);
    } catch (error) {
      _showMessage('Could not save this demo status: $error');
    }
  }

  Future<void> _markAllPresent() async {
    setState(() => _saving = true);
    try {
      await widget.repository.markAllPresent(widget.classroom, widget.hour);
      if (mounted) {
        setState(() {
          _statuses = {
            for (final student in _students)
              student.registerNumber: AttendanceStatus.present,
          };
          _saving = false;
        });
      }
    } catch (error) {
      if (mounted) setState(() => _saving = false);
      _showMessage('Could not mark all demo students present: $error');
    }
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  int _count(AttendanceStatus status) =>
      _statuses.values.where((value) => value == status).length;

  @override
  Widget build(BuildContext context) {
    final filtered = _students.where((student) {
      final searchable =
          '${student.name} ${student.registerNumber} ${student.rollNumber}'
              .toLowerCase();
      return searchable.contains(_query);
    }).toList();
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.hour),
        actions: [
          IconButton(
            tooltip: 'Staff profile',
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute<void>(
                builder: (_) => ProfileScreen(repository: widget.repository),
              ),
            ),
            icon: const Icon(Icons.account_circle_outlined),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 2, 20, 10),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              widget.classroom.label,
                              style: const TextStyle(
                                color: _ink,
                                fontWeight: FontWeight.w700,
                                fontSize: 16,
                              ),
                            ),
                          ),
                          Text(
                            '${_statuses.length}/${_students.length} marked',
                            style: const TextStyle(
                              color: _muted,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      _AttendanceSummary(
                        present: _count(AttendanceStatus.present),
                        absent: _count(AttendanceStatus.absent),
                        late: _count(AttendanceStatus.late),
                        excused: _count(AttendanceStatus.excused),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _searchController,
                              decoration: const InputDecoration(
                                hintText: 'Search name, register or roll no.',
                                prefixIcon: Icon(Icons.search),
                                isDense: true,
                              ),
                            ),
                          ),
                          const SizedBox(width: 9),
                          OutlinedButton.icon(
                            onPressed: _saving ? null : _markAllPresent,
                            icon: _saving
                                ? const SizedBox(
                                    width: 15,
                                    height: 15,
                                    child: CircularProgressIndicator(
                                        strokeWidth: 2),
                                  )
                                : const Icon(Icons.done_all, size: 17),
                            label: const Text('All present'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: _green,
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 11),
                              minimumSize: const Size(0, 49),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(13),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: filtered.isEmpty
                      ? Center(
                          child: Text(
                            _students.isEmpty
                                ? 'No demo students found.'
                                : 'No students match “$_query”.',
                            style: const TextStyle(color: _muted),
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.fromLTRB(20, 2, 20, 12),
                          itemCount: filtered.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(height: 9),
                          itemBuilder: (context, index) {
                            final student = filtered[index];
                            return _StudentTile(
                              student: student,
                              status: _statuses[student.registerNumber],
                              onTap: () => _chooseStatus(student),
                            );
                          },
                        ),
                ),
                Container(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 18),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    border: Border(top: BorderSide(color: _line)),
                  ),
                  child: SafeArea(
                    top: false,
                    child: SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: _saving
                            ? null
                            : () => Navigator.push(
                                  context,
                                  MaterialPageRoute<void>(
                                    builder: (_) => ReviewScreen(
                                      classroom: widget.classroom,
                                      hour: widget.hour,
                                      repository: widget.repository,
                                    ),
                                  ),
                                ),
                        icon: const Icon(Icons.fact_check_outlined),
                        label: const Text('Review attendance'),
                        style: FilledButton.styleFrom(
                          minimumSize: const Size.fromHeight(52),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(15),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}

class ReviewScreen extends StatefulWidget {
  const ReviewScreen({
    super.key,
    required this.classroom,
    required this.hour,
    required this.repository,
  });

  final Classroom classroom;
  final String hour;
  final AttendanceRepository repository;

  @override
  State<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends State<ReviewScreen> {
  late Future<_ReviewData> _data;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _data = _load();
  }

  Future<_ReviewData> _load() async {
    final statuses =
        await widget.repository.attendanceFor(widget.classroom, widget.hour);
    final students = widget.repository.studentsFor(widget.classroom);
    return _ReviewData(
      students: students,
      statuses: statuses,
      present:
          statuses.values.where((s) => s == AttendanceStatus.present).length,
      absent: statuses.values.where((s) => s == AttendanceStatus.absent).length,
      late: statuses.values.where((s) => s == AttendanceStatus.late).length,
      excused:
          statuses.values.where((s) => s == AttendanceStatus.excused).length,
    );
  }

  Future<void> _submit() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Submit demo attendance?'),
        content: const Text(
          'This saves a local demo receipt only. No real attendance system '
          'will be contacted.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Go back'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Submit demo'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _submitting = true);
    try {
      final receipt =
          await widget.repository.submit(widget.classroom, widget.hour);
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute<void>(
          builder: (_) => SubmissionScreen(
            receipt: receipt,
            total: widget.repository.studentsFor(widget.classroom).length,
          ),
        ),
      );
    } catch (error) {
      if (mounted) {
        setState(() => _submitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not submit demo attendance: $error')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Review attendance')),
      body: FutureBuilder<_ReviewData>(
        future: _data,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(
              child: Text('Could not review attendance: ${snapshot.error}'),
            );
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final data = snapshot.data!;
          final unmarked = data.students.length - data.statuses.length;
          return Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    const _DemoBanner(
                      text: 'FINAL REVIEW · DEMO DATA ONLY',
                    ),
                    const SizedBox(height: 16),
                    Text(
                      widget.classroom.label,
                      style: const TextStyle(
                        color: _ink,
                        fontSize: 23,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${widget.hour} · ${data.students.length} fictional students',
                      style: const TextStyle(color: _muted, fontSize: 14),
                    ),
                    const SizedBox(height: 18),
                    _AttendanceSummary(
                      present: data.present,
                      absent: data.absent,
                      late: data.late,
                      excused: data.excused,
                    ),
                    const SizedBox(height: 14),
                    _SummaryLine(
                      label: 'Students with a status',
                      value: '${data.statuses.length}',
                    ),
                    _SummaryLine(
                      label: 'Not marked',
                      value: '$unmarked',
                      valueColor: unmarked == 0 ? _green : const Color(0xFFB54708),
                    ),
                    const SizedBox(height: 18),
                    const Text(
                      'Student review',
                      style: TextStyle(
                        color: _ink,
                        fontWeight: FontWeight.w700,
                        fontSize: 17,
                      ),
                    ),
                    const SizedBox(height: 9),
                    for (final student in data.students)
                      _StudentTile(
                        student: student,
                        status: data.statuses[student.registerNumber],
                        compact: true,
                      ),
                    const SizedBox(height: 12),
                    const Text(
                      'Submitting creates a local prototype receipt only. '
                      'Unmarked students remain unmarked.',
                      style: TextStyle(color: _muted, fontSize: 12),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 18),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  border: Border(top: BorderSide(color: _line)),
                ),
                child: SafeArea(
                  top: false,
                  child: SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: _submitting ? null : _submit,
                      icon: _submitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.cloud_done_outlined),
                      label: const Text('Submit demo attendance'),
                      style: FilledButton.styleFrom(
                        minimumSize: const Size.fromHeight(52),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _ReviewData {
  const _ReviewData({
    required this.students,
    required this.statuses,
    required this.present,
    required this.absent,
    required this.late,
    required this.excused,
  });

  final List<DemoStudent> students;
  final Map<String, AttendanceStatus> statuses;
  final int present;
  final int absent;
  final int late;
  final int excused;
}

class SubmissionScreen extends StatelessWidget {
  const SubmissionScreen({super.key, required this.receipt, required this.total});

  final SubmissionReceipt receipt;
  final int total;

  @override
  Widget build(BuildContext context) {
    final time = TimeOfDay.fromDateTime(receipt.submittedAt).format(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 430),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const _DemoBanner(text: 'DEMO SUBMISSION · LOCAL ONLY'),
                  const SizedBox(height: 24),
                  Container(
                    width: 78,
                    height: 78,
                    decoration: const BoxDecoration(
                      color: Color(0xFFE5F3EE),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check, color: _green, size: 42),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Attendance submitted',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: _ink,
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 7),
                  Text(
                    '${receipt.classroom.label} · ${receipt.hour}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: _muted, fontSize: 14),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    'Demo receipt saved at $time',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: _muted, fontSize: 13),
                  ),
                  const SizedBox(height: 22),
                  _AttendanceSummary(
                    present: receipt.present,
                    absent: receipt.absent,
                    late: receipt.late,
                    excused: receipt.excused,
                  ),
                  const SizedBox(height: 10),
                  _SummaryLine(label: 'Class size', value: '$total'),
                  _SummaryLine(
                    label: 'Not marked',
                    value: '${receipt.unmarked}',
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'This confirmation is fictional and stored only on this '
                    'device. It is not a college report.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: _muted, fontSize: 12),
                  ),
                  const SizedBox(height: 22),
                  FilledButton(
                    onPressed: () =>
                        Navigator.of(context).popUntil((route) => route.isFirst),
                    style: FilledButton.styleFrom(
                      minimumSize: const Size.fromHeight(52),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15),
                      ),
                    ),
                    child: const Text('Back to dashboard'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key, required this.repository});

  final AttendanceRepository repository;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Staff profile')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const SizedBox(height: 8),
          const Center(
            child: CircleAvatar(
              radius: 42,
              backgroundColor: Color(0xFFE5F3EE),
              child: Icon(Icons.person_outline, color: _green, size: 42),
            ),
          ),
          const SizedBox(height: 14),
          const Text(
            'Demo Staff',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: _ink,
              fontSize: 23,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Staff account · Prototype',
            textAlign: TextAlign.center,
            style: TextStyle(color: _muted, fontSize: 14),
          ),
          const SizedBox(height: 22),
          const _ProfileDetail(
            icon: Icons.mail_outline,
            title: 'Email',
            value: 'staff@demo.edu',
          ),
          const SizedBox(height: 10),
          const _ProfileDetail(
            icon: Icons.shield_outlined,
            title: 'Account mode',
            value: 'Demo only · No authentication',
          ),
          const SizedBox(height: 10),
          const _ProfileDetail(
            icon: Icons.storage_outlined,
            title: 'Attendance storage',
            value: 'Saved locally on this device',
          ),
          const SizedBox(height: 18),
          const _DemoBanner(
            text: 'All displayed identities and records are fictional',
          ),
          const SizedBox(height: 22),
          OutlinedButton.icon(
            onPressed: () => Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute<void>(
                builder: (_) => LoginScreen(repository: repository),
              ),
              (route) => false,
            ),
            icon: const Icon(Icons.logout),
            label: const Text('Return to demo sign in'),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(50),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BrandMark extends StatelessWidget {
  const _BrandMark({this.size, this.compact = false});

  final double? size;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final iconSize = size ?? 32;
    return Row(
      mainAxisSize: compact ? MainAxisSize.min : MainAxisSize.max,
      children: [
        Container(
          width: iconSize,
          height: iconSize,
          decoration: BoxDecoration(
            color: _green,
            borderRadius: BorderRadius.circular(iconSize * .28),
          ),
          child: Icon(Icons.fact_check_outlined,
              color: Colors.white, size: iconSize * .54),
        ),
        SizedBox(width: compact ? 9 : 12),
        Text(
          'Campus',
          style: TextStyle(
            color: _ink,
            fontSize: compact ? 18 : 20,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.4,
          ),
        ),
        if (!compact) ...[
          const SizedBox(width: 5),
          const Text(
            'attendance',
            style: TextStyle(color: _muted, fontSize: 18),
          ),
        ],
      ],
    );
  }
}

class _DemoBanner extends StatelessWidget {
  const _DemoBanner({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF6E5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFF2D49A)),
      ),
      child: Row(
        children: [
          const Icon(Icons.science_outlined,
              size: 17, color: Color(0xFF9A6700)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: Color(0xFF805B13),
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.label);

  final String label;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 7),
        child: Text(
          label,
          style: const TextStyle(
            color: _ink,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      );
}

class _DepartmentTile extends StatelessWidget {
  const _DepartmentTile({required this.department, required this.onTap});

  final Department department;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(15),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(0xFFEAF4F0),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  department.abbreviation,
                  style: const TextStyle(
                    color: _green,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      department.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: _ink,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const Icon(Icons.arrow_forward,
                      color: _green, size: 17),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _YearTile extends StatelessWidget {
  const _YearTile({
    required this.classroom,
    required this.count,
    required this.onTap,
  });

  final Classroom classroom;
  final int count;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        leading: Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
            color: const Color(0xFFEAF4F0),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Center(
            child: Text(
              '0${classroom.year}',
              style: const TextStyle(
                color: _green,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ),
        title: Text(
          classroom.yearName,
          style: const TextStyle(
            color: _ink,
            fontWeight: FontWeight.w700,
          ),
        ),
        subtitle: Text('$count demo students'),
        trailing: const Icon(Icons.chevron_right, color: _muted),
      ),
    );
  }
}

class _HourTile extends StatelessWidget {
  const _HourTile({
    required this.hour,
    required this.marked,
    required this.total,
    required this.onTap,
  });

  final String hour;
  final int marked;
  final int total;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final complete = marked == total;
    return Card(
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
            color: const Color(0xFFEAF4F0),
            borderRadius: BorderRadius.circular(14),
          ),
          child: const Icon(Icons.access_time, color: _green),
        ),
        title: Text(
          hour,
          style: const TextStyle(
            color: _ink,
            fontWeight: FontWeight.w700,
          ),
        ),
        subtitle: Text(complete ? 'All students marked' : '$marked/$total marked'),
        trailing: complete
            ? const Icon(Icons.check_circle, color: _green)
            : const Icon(Icons.chevron_right, color: _muted),
      ),
    );
  }
}

class _StudentTile extends StatelessWidget {
  const _StudentTile({
    required this.student,
    required this.status,
    this.onTap,
    this.compact = false,
  });

  final DemoStudent student;
  final AttendanceStatus? status;
  final VoidCallback? onTap;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final statusColor = _statusColor(status);
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: EdgeInsets.symmetric(
            horizontal: compact ? 11 : 13,
            vertical: compact ? 7 : 10,
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: compact ? 17 : 20,
                backgroundColor: const Color(0xFFEAF4F0),
                child: Text(
                  student.name.split(' ').skip(1).take(1).join().isEmpty
                      ? 'D'
                      : student.name.split(' ').skip(1).take(1).join()[0],
                  style: const TextStyle(
                    color: _green,
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      student.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: _ink,
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${student.registerNumber} · Roll ${student.rollNumber}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: _muted, fontSize: 10),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(.10),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  status?.label ?? 'Unmarked',
                  style: TextStyle(
                    color: status == null ? _muted : statusColor,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              if (onTap != null) ...[
                const SizedBox(width: 4),
                const Icon(Icons.more_vert, size: 18, color: _muted),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _AttendanceSummary extends StatelessWidget {
  const _AttendanceSummary({
    required this.present,
    required this.absent,
    required this.late,
    required this.excused,
  });

  final int present;
  final int absent;
  final int late;
  final int excused;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _CountChip(label: 'Present', count: present, color: _statusColor(AttendanceStatus.present)),
        const SizedBox(width: 6),
        _CountChip(label: 'Absent', count: absent, color: _statusColor(AttendanceStatus.absent)),
        const SizedBox(width: 6),
        _CountChip(label: 'Late', count: late, color: _statusColor(AttendanceStatus.late)),
        const SizedBox(width: 6),
        _CountChip(label: 'Excused', count: excused, color: _statusColor(AttendanceStatus.excused)),
      ],
    );
  }
}

class _CountChip extends StatelessWidget {
  const _CountChip({
    required this.label,
    required this.count,
    required this.color,
  });

  final String label;
  final int count;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 3),
        decoration: BoxDecoration(
          color: color.withOpacity(.08),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(
              '$count',
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w800,
                fontSize: 16,
              ),
            ),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: color, fontSize: 9),
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryLine extends StatelessWidget {
  const _SummaryLine({
    required this.label,
    required this.value,
    this.valueColor = _ink,
  });

  final String label;
  final String value;
  final Color valueColor;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: const TextStyle(color: _muted)),
          ),
          Text(
            value,
            style: TextStyle(
              color: valueColor,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusIcon extends StatelessWidget {
  const _StatusIcon({required this.status});

  final AttendanceStatus status;

  @override
  Widget build(BuildContext context) => CircleAvatar(
        radius: 17,
        backgroundColor: _statusColor(status).withOpacity(.11),
        child: Icon(_statusIcon(status), color: _statusColor(status), size: 18),
      );
}

class _ProfileDetail extends StatelessWidget {
  const _ProfileDetail({
    required this.icon,
    required this.title,
    required this.value,
  });

  final IconData icon;
  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon, color: _green),
        title: Text(title,
            style: const TextStyle(color: _muted, fontSize: 12)),
        subtitle: Text(
          value,
          style: const TextStyle(
            color: _ink,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

Color _statusColor(AttendanceStatus? status) => switch (status) {
      AttendanceStatus.present => const Color(0xFF176B56),
      AttendanceStatus.absent => const Color(0xFFB42318),
      AttendanceStatus.late => const Color(0xFFB54708),
      AttendanceStatus.excused => const Color(0xFF6941C6),
      null => const Color(0xFF66736D),
    };

IconData _statusIcon(AttendanceStatus status) => switch (status) {
      AttendanceStatus.present => Icons.check_circle_outline,
      AttendanceStatus.absent => Icons.cancel_outlined,
      AttendanceStatus.late => Icons.schedule_outlined,
      AttendanceStatus.excused => Icons.event_available_outlined,
    };
