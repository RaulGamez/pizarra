// /modules/board/exporters.ts
import { Platform, Share } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export async function exportPNG(ref: any, name = 'play.png') {
  const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    await Share.share({ url: uri, message: 'Pizarra' });
  }
  return uri;
}
