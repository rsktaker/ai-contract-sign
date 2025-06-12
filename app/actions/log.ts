// app/actions/log.ts
'use server';

export async function server_log(message: string) {
  console.info(message);  // this runs on the server
}
