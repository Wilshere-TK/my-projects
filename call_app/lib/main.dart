// Name: wilshere mboya
// Registration Number: IN16/00088/23

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

void main() => runApp(CallApp());

class CallApp extends StatelessWidget {
  const CallApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(title: 'Phone Dialer', home: DialScreen());
  }
}

class DialScreen extends StatefulWidget {
  const DialScreen({super.key});

  @override
  _DialScreenState createState() => _DialScreenState();
}

class _DialScreenState extends State<DialScreen> {
  final TextEditingController _controller = TextEditingController();

  void _dialNumber() async {
    final number = _controller.text;
    final Uri url = Uri(scheme: 'tel', path: number);
    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    } else {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Cannot make a call')));
    }
  }

  void _endCall() {
    _controller.clear();
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text('Call ended')));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Simple Phone Dialer')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            TextField(
              controller: _controller,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                labelText: 'Enter phone number',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                ElevatedButton(onPressed: _dialNumber, child: Text('Dial')),
                ElevatedButton(
                  onPressed: _endCall,
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                  child: Text('End Call'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
