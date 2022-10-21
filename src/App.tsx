import React, {  useEffect, useState } from 'react';
import './App.css';
import "@aws-amplify/ui-react/styles.css";
import {
  withAuthenticator,
  WithAuthenticatorProps,
  Button,
  Heading,
  View,
  Text,
  TextField,
  Flex,
  Image,
} from "@aws-amplify/ui-react";

import { API } from 'aws-amplify';
import { listNotes } from "./graphql/queries"
import {
  createNote as createNoteMutation,
  deleteNote as deleteNoteMutation,
} from "./graphql/mutations";

import { Storage } from 'aws-amplify';

import { DataStore } from '@aws-amplify/datastore';
import { Note } from './models';

function App({ signOut }: WithAuthenticatorProps) {
  const [notes, setNotes] = useState<Array<Note>>([]);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    // With GraphQL API
    // const apiData: any = await API.graphql({ query: listNotes });
    // const notesFromAPI = apiData.data.listNotes.items;

    // Through DataStore
    const notesFromAPI = await DataStore.query(Note);

    // Load the storage links manually ...
    // await Promise.all(
    //   notesFromAPI.map(async (note: any) => {
    //     if (note.image) {
    //       const url = await Storage.get(note.name);
    //       note.image = url;
    //     }
    //     return note;
    //   })
    // );

    setNotes(notesFromAPI);
  }

  async function createNote(event: any) {
    event.preventDefault();
    const form = new FormData(event.target);
    const image: any = form.get("image");
    const data = {
      name: form.get("name") as string,
      description: form.get("description") as string,
      image: image.name as string
    };

    // Save the image manually ...
    if (!!data.image) {
      await Storage.put(data.name as string, image);
    }

    // await API.graphql({
    //   query: createNoteMutation,
    //   variables: { input: data },
    // });

    // Using DataStore
    await DataStore.save(
      new Note(data)
    );

    // do we need this??
    fetchNotes();
    event.target.reset();
  }
  
  async function deleteNote({ id, name }: {id: string; name: string}) {
    const newNotes = notes.filter((note) => note.id !== id);
    setNotes(newNotes);

    // Delete the image manually ...
    await Storage.remove(name);

    // await API.graphql({
    //   query: deleteNoteMutation,
    //   variables: { input: { id } },
    // });

    // Using DataStore
    const modelToDelete = await DataStore.query(Note, id);
    if (modelToDelete) {
      await DataStore.delete(modelToDelete);
    }
  }

  return (
    <View className="App">
      <Heading level={1}>My Notes App</Heading>
      <View as="form" margin="3rem 0" onSubmit={createNote}>
        <Flex direction="row" justifyContent="center">
          <TextField
            name="name"
            placeholder="Note Name"
            label="Note Name"
            labelHidden
            variation="quiet"
            required
          />
          <TextField
            name="description"
            placeholder="Note Description"
            label="Note Description"
            labelHidden
            variation="quiet"
            required
          />
          <View
            name="image"
            as="input"
            type="file"
            style={{ alignSelf: "end" }}
          />
          <Button type="submit" variation="primary">
            Create Note
          </Button>
        </Flex>
      </View>
      <Heading level={2}>Current Notes</Heading>
      <View margin="3rem 0">
        {notes.map((note) => (
          <Flex
            key={note.id || note.name}
            direction="row"
            justifyContent="center"
            alignItems="center"
          >
            <Text as="strong" fontWeight={700}>
              {note.name}
            </Text>
            <Text as="span">{note.description}</Text>
            {note.image && (
              <Image
                src={note.image}
                alt={`visual aid for ${note.name}`}
                style={{ width: 400 }}
              />
            )}
            <Button variation="link" onClick={() => deleteNote(note)}>
              Delete note
            </Button>
          </Flex>
        ))}
      </View>
      <Button onClick={signOut}>Sign Out</Button>
    </View>
  );
}

export default withAuthenticator(App);
