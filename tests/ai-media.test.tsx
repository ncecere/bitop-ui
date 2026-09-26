/*
 * Behaviour tests for the AI media items: agent, open-in-chat, image,
 * audio-player, mic-selector, voice-selector, speech-input, transcription,
 * sandbox and web-preview.
 */
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { axe } from "vitest-axe";
import { Agent, AgentContent, AgentHeader, AgentInstructions, AgentOutput, AgentTool, AgentTools } from "@/registry/bitop/ui/agent/agent";
import { AudioPlayer, formatTime } from "@/registry/bitop/ui/audio-player/audio-player";
import { Image } from "@/registry/bitop/ui/image/image";
import { MicSelector } from "@/registry/bitop/ui/mic-selector/mic-selector";
import { OpenInChat, OpenInChatItem, openInChatProviders } from "@/registry/bitop/ui/open-in-chat/open-in-chat";
import { Sandbox, SandboxCode, SandboxContent, SandboxHeader, SandboxOutput, SandboxTab, SandboxTabPanel, SandboxTabs, SandboxTabsList } from "@/registry/bitop/ui/sandbox/sandbox";
import { SpeechInput } from "@/registry/bitop/ui/speech-input/speech-input";
import { Transcription, type TranscriptSegment } from "@/registry/bitop/ui/transcription/transcription";
import { type Voice, VoiceSelector } from "@/registry/bitop/ui/voice-selector/voice-selector";
import {
  WebPreview,
  WebPreviewBack,
  WebPreviewBody,
  WebPreviewConsole,
  WebPreviewForward,
  WebPreviewNavigation,
  WebPreviewReload,
  WebPreviewUrl,
  normalizeUrl,
} from "@/registry/bitop/ui/web-preview/web-preview";

/** axe can't message jsdom iframes, and frame content isn't ours to audit. */
const noFrames = { iframes: false } as const;

/** Sets a writable own property on an object for the duration of a test. */
function stub<T extends object>(target: T, key: string, value: unknown) {
  const had = Object.prototype.hasOwnProperty.call(target, key);
  const previous = Object.getOwnPropertyDescriptor(target, key);
  Object.defineProperty(target, key, { configurable: true, writable: true, value });
  return () => {
    if (had && previous) Object.defineProperty(target, key, previous);
    else delete (target as Record<string, unknown>)[key];
  };
}

const restores: (() => void)[] = [];
afterEach(() => {
  while (restores.length) restores.pop()!();
});

describe("Agent", () => {
  it("names the card, groups sections and toggles tool schemas from the keyboard", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <Agent>
        <AgentHeader name="Researcher" model="claude-sonnet-4" />
        <AgentContent>
          <AgentInstructions>Cite every source.</AgentInstructions>
          <AgentTools onValueChange={onValueChange}>
            <AgentTool name="search" description="Search the web" schema={{ type: "object", properties: { q: { type: "string" } } }} />
            <AgentTool name="now" />
          </AgentTools>
          <AgentOutput schema="z.object({ answer: z.string() })" />
        </AgentContent>
      </Agent>,
    );
    expect(screen.getByRole("region", { name: "Researcher" })).toBeInTheDocument();
    expect(screen.getByText("claude-sonnet-4").textContent).toBe("Model: claude-sonnet-4");
    expect(screen.getByRole("group", { name: "Instructions" })).toHaveTextContent("Cite every source.");
    expect(screen.getByRole("group", { name: "Output schema" })).toHaveTextContent("z.object");

    const tools = screen.getByRole("group", { name: "Tools" });
    const trigger = within(tools).getByRole("button", { name: /search/ });
    expect(trigger.closest("h3")).not.toBeNull();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(onValueChange).toHaveBeenLastCalledWith(["search"]);
    expect(await screen.findByText(/"q"/)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    await user.click(within(tools).getByRole("button", { name: "now" }));
    expect(await screen.findByText("No input parameters.")).toBeInTheDocument();
    // Single-open accordion by default.
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});

describe("OpenInChat", () => {
  it("lists provider links with the encoded prompt and reports the choice", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const custom = { id: "campus", title: "Open in Campus AI", createUrl: (q: string) => `https://ai.example.edu/?q=${encodeURIComponent(q)}` };
    render(
      <OpenInChat query="Explain a & b" providers={["claude", custom]} onOpen={onOpen} groupLabel="Open this prompt in">
        <OpenInChatItem provider="v0" query="Build it" />
      </OpenInChat>,
    );
    const trigger = screen.getByRole("button", { name: "Open in chat" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    trigger.focus();
    await user.keyboard("{Enter}");
    const menu = await screen.findByRole("menu");
    const items = within(menu).getAllByRole("menuitem");
    expect(items.map((i) => i.textContent)).toEqual([
      "Open in Claude (opens in a new tab)",
      "Open in Campus AI (opens in a new tab)",
      "Open in v0 (opens in a new tab)",
    ]);
    expect(items[0]).toHaveAttribute("href", "https://claude.ai/new?q=Explain+a+%26+b");
    expect(items[0]).toHaveAttribute("target", "_blank");
    expect(items[0]).toHaveAttribute("rel", "noopener noreferrer");
    expect(items[1]).toHaveAttribute("href", "https://ai.example.edu/?q=Explain%20a%20%26%20b");
    expect(items[2]).toHaveAttribute("href", openInChatProviders.v0.createUrl("Build it"));
    await waitFor(() => expect(items[0]).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(items[1]).toHaveFocus());
    expect(await axe(menu)).toHaveNoViolations();

    // jsdom can't navigate; stop the default action but keep the handler.
    const block = (e: Event) => e.preventDefault();
    document.addEventListener("click", block);
    await user.click(items[1]!);
    document.removeEventListener("click", block);
    expect(onOpen).toHaveBeenCalledWith(custom, "https://ai.example.edu/?q=Explain%20a%20%26%20b");
  });

  it("builds the documented URLs for built-in providers", () => {
    expect(openInChatProviders.chatgpt.createUrl("hi there")).toBe("https://chatgpt.com/?hints=search&prompt=hi+there");
    expect(openInChatProviders.cursor.createUrl("x")).toBe("https://cursor.com/link/prompt?text=x");
  });
});

describe("Image", () => {
  it("builds a data URL, is busy until loaded and falls back to text on error", async () => {
    const { container, rerender } = render(<Image base64="AAAA" mediaType="image/webp" alt="A red bicycle" aspectRatio="4 / 3" />);
    const img = screen.getByRole("img", { name: "A red bicycle" });
    expect(img).toHaveAttribute("src", "data:image/webp;base64,AAAA");
    const frame = img.parentElement!;
    expect(frame).toHaveAttribute("aria-busy", "true");
    fireEvent.load(img);
    expect(frame).not.toHaveAttribute("aria-busy");
    expect(frame).toHaveAttribute("data-state", "loaded");
    expect(await axe(container)).toHaveNoViolations();

    rerender(<Image src="/missing.png" alt="A red bicycle" />);
    expect(frame).toHaveAttribute("data-state", "loading");
    fireEvent.error(screen.getByRole("img"));
    expect(screen.queryByRole("img")).toBeNull();
    expect(frame).toHaveTextContent("Image unavailable");
    expect(frame).toHaveTextContent("A red bicycle");
  });

  it("turns bytes into an object URL and revokes it on unmount", async () => {
    const create = vi.fn(() => "blob:mock-1");
    const revoke = vi.fn();
    restores.push(stub(URL, "createObjectURL", create), stub(URL, "revokeObjectURL", revoke));
    const bytes = new Uint8Array([137, 80, 78, 71]);
    const { unmount } = render(<Image uint8Array={bytes} mediaType="image/png" alt="Chart" />);
    await waitFor(() => expect(screen.getByRole("img", { name: "Chart" })).toHaveAttribute("src", "blob:mock-1"));
    expect(create).toHaveBeenCalledTimes(1);
    unmount();
    expect(revoke).toHaveBeenCalledWith("blob:mock-1");
  });
});

describe("AudioPlayer", () => {
  function mockMedia() {
    const proto = HTMLMediaElement.prototype;
    const play = vi.fn(function (this: HTMLMediaElement) {
      Object.defineProperty(this, "paused", { configurable: true, value: false });
      this.dispatchEvent(new Event("play"));
      return Promise.resolve();
    });
    const pause = vi.fn(function (this: HTMLMediaElement) {
      Object.defineProperty(this, "paused", { configurable: true, value: true });
      this.dispatchEvent(new Event("pause"));
    });
    restores.push(stub(proto, "play", play), stub(proto, "pause", pause));
    return { play, pause };
  }

  function loadMetadata(audio: HTMLAudioElement, duration: number) {
    Object.defineProperty(audio, "duration", { configurable: true, value: duration });
    fireEvent.loadedMetadata(audio);
  }

  it("plays, pauses, seeks with the keyboard, mutes and changes volume", async () => {
    const { play, pause } = mockMedia();
    const user = userEvent.setup();
    const onPlay = vi.fn();
    const { container } = render(<AudioPlayer label="Generated speech" src="/speech.mp3" skipSeconds={10} onPlay={onPlay} />);
    const player = screen.getByRole("group", { name: "Generated speech" });
    const audio = container.querySelector("audio")!;
    const seek = within(player).getByRole("slider", { name: "Seek" });
    expect(seek).toBeDisabled();

    loadMetadata(audio, 125);
    await waitFor(() => expect(seek).not.toBeDisabled());
    expect(seek).toHaveAttribute("aria-valuetext", "0:00 of 2:05");
    expect(player).toHaveTextContent("2:05");

    await user.click(within(player).getByRole("button", { name: "Play" }));
    expect(play).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveBeenCalled();
    const pauseButton = within(player).getByRole("button", { name: "Pause" });

    act(() => seek.focus());
    await user.keyboard("{PageUp}");
    expect(audio.currentTime).toBe(10);
    expect(seek).toHaveAttribute("aria-valuetext", "0:10 of 2:05");
    await user.click(within(player).getByRole("button", { name: "Forward 10 seconds" }));
    expect(audio.currentTime).toBe(20);

    const mute = within(player).getByRole("button", { name: "Mute" });
    expect(mute).toHaveAttribute("aria-pressed", "false");
    await user.click(mute);
    expect(mute).toHaveAttribute("aria-pressed", "true");
    expect(audio.muted).toBe(true);

    const volume = within(player).getByRole("slider", { name: "Volume" });
    expect(volume).toHaveAttribute("aria-valuetext", "0%");
    act(() => volume.focus());
    await user.keyboard("{End}");
    expect(audio.volume).toBe(1);
    expect(audio.muted).toBe(false);
    expect(mute).toHaveAttribute("aria-pressed", "false");

    await user.click(pauseButton);
    expect(pause).toHaveBeenCalledTimes(1);
    expect(within(player).getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("changes the playback rate from the speed select", async () => {
    mockMedia();
    const user = userEvent.setup();
    const { container } = render(<AudioPlayer label="Clip" src="/clip.mp3" playbackRates={[1, 2]} />);
    const audio = container.querySelector("audio")!;
    await user.click(screen.getByRole("combobox", { name: "Playback speed" }));
    await user.click(await screen.findByRole("option", { name: "2×" }));
    expect(audio.playbackRate).toBe(2);
  });

  it("formats times", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(65.4)).toBe("1:05");
    expect(formatTime(3725)).toBe("1:02:05");
    expect(formatTime(Number.NaN)).toBe("0:00");
  });
});

describe("MicSelector", () => {
  type Device = Pick<MediaDeviceInfo, "deviceId" | "kind" | "label" | "groupId">;
  function mockDevices(initial: Device[], afterPermission: Device[]) {
    let granted = false;
    const target = new EventTarget();
    const track = { stop: vi.fn() };
    const md = {
      enumerateDevices: vi.fn(async () => (granted ? afterPermission : initial) as MediaDeviceInfo[]),
      getUserMedia: vi.fn(async () => {
        granted = true;
        return { getTracks: () => [track] } as unknown as MediaStream;
      }),
      addEventListener: target.addEventListener.bind(target),
      removeEventListener: target.removeEventListener.bind(target),
      dispatchEvent: target.dispatchEvent.bind(target),
    };
    restores.push(stub(navigator, "mediaDevices", md));
    return { md, track, setDevices: (d: Device[]) => (afterPermission = d) };
  }

  const dev = (deviceId: string, label: string): Device => ({ deviceId, label, kind: "audioinput", groupId: "g" });

  it("asks for permission to reveal names, then selects a device", async () => {
    const { md, track } = mockDevices(
      [dev("a", ""), { deviceId: "cam", label: "", kind: "videoinput", groupId: "g" }],
      [dev("a", "MacBook Pro Microphone"), dev("b", "Yeti Stereo (046d:0ab1)")],
    );
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<MicSelector label="Microphone" onValueChange={onValueChange} />);
    const trigger = await screen.findByRole("combobox", { name: "Microphone" });
    await user.click(trigger);
    expect(await screen.findByRole("option", { name: "Microphone 1" })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Allow microphone access" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Allow microphone access" })).toBeNull());
    expect(md.getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(track.stop).toHaveBeenCalled();

    await user.click(screen.getByRole("combobox", { name: "Microphone" }));
    await user.click(await screen.findByRole("option", { name: "Yeti Stereo" }));
    expect(onValueChange).toHaveBeenCalledWith("b", expect.objectContaining({ deviceId: "b" }));
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Microphone" })).toHaveTextContent("Yeti Stereo"));
    expect(await axe(container)).toHaveNoViolations();
  });

  it("refreshes on devicechange", async () => {
    const { md, setDevices } = mockDevices([dev("a", "Built-in")], [dev("a", "Built-in")]);
    render(<MicSelector label="Microphone" />);
    await screen.findByRole("combobox", { name: "Microphone" });
    const calls = md.enumerateDevices.mock.calls.length;
    setDevices([dev("a", "Built-in"), dev("h", "Headset")]);
    await act(async () => {
      md.dispatchEvent(new Event("devicechange"));
    });
    expect(md.enumerateDevices.mock.calls.length).toBeGreaterThan(calls);
  });

  it("announces a blocked permission", async () => {
    const { md } = mockDevices([dev("", "")], []);
    md.getUserMedia.mockRejectedValueOnce(Object.assign(new Error("denied"), { name: "NotAllowedError" }));
    const user = userEvent.setup();
    render(<MicSelector label="Microphone" />);
    await user.click(await screen.findByRole("button", { name: "Allow microphone access" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Microphone access is blocked.");
  });

  it("explains itself where mediaDevices is missing", async () => {
    restores.push(stub(navigator, "mediaDevices", undefined));
    const { container } = render(<MicSelector label="Microphone" />);
    expect(await screen.findByText("Microphone selection isn't available in this browser.")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("VoiceSelector", () => {
  const voices: Voice[] = [
    { id: "aria", name: "Aria", gender: "Female", accent: "American" },
    { id: "ellis", name: "Ellis", gender: "Male", accent: "British", description: "Calm" },
    { id: "kai", name: "Kai", gender: "Neutral", accent: "Australian" },
  ];

  it("searches, selects with arrow keys and previews", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onPreview = vi.fn();
    function Harness() {
      const [value, setValue] = useState<string | null>("aria");
      return (
        <VoiceSelector
          label="Voice"
          voices={voices}
          value={value}
          onValueChange={(id, v) => {
            setValue(id);
            onValueChange(id, v);
          }}
          onPreview={onPreview}
          previewingId="kai"
        />
      );
    }
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Voice: Aria" }));
    const dialog = await screen.findByRole("dialog", { name: "Choose a voice" });
    const search = within(dialog).getByRole("searchbox", { name: "Search voices" });
    await waitFor(() => expect(search).toHaveFocus());
    const group = within(dialog).getByRole("radiogroup", { name: "Voice" });
    expect(within(group).getByRole("radio", { name: /Aria/ })).toHaveAttribute("aria-checked", "true");
    expect(within(group).getByText("Male · British")).toBeInTheDocument();
    expect(within(group).getByRole("button", { name: "Preview Kai" })).toHaveAttribute("aria-pressed", "true");
    expect(await axe(dialog)).toHaveNoViolations();

    within(group).getByRole("radio", { name: /Aria/ }).focus();
    await user.keyboard("{ArrowDown}");
    expect(onValueChange).toHaveBeenLastCalledWith("ellis", voices[1]);
    await waitFor(() => expect(within(group).getByRole("radio", { name: /Ellis/ })).toHaveAttribute("aria-checked", "true"));

    await user.click(within(group).getByRole("button", { name: "Preview Ellis" }));
    expect(onPreview).toHaveBeenCalledWith(voices[1]);

    await user.type(search, "austr");
    expect(within(group).getAllByRole("radio")).toHaveLength(1);
    expect(within(dialog).getByRole("status")).toHaveTextContent("1 voice");
    await user.clear(search);
    await user.type(search, "zzz");
    expect(within(dialog).getByRole("status")).toHaveTextContent("No voices match your search.");

    await user.click(within(dialog).getByRole("button", { name: "Done" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByRole("button", { name: "Voice: Ellis" })).toBeInTheDocument();
  });
});

describe("SpeechInput", () => {
  class FakeRecognition extends EventTarget {
    static last: FakeRecognition | null = null;
    continuous = false;
    interimResults = false;
    lang = "";
    start = vi.fn(() => this.dispatchEvent(new Event("start")));
    stop = vi.fn(() => this.dispatchEvent(new Event("end")));
    abort = vi.fn();
    constructor() {
      super();
      FakeRecognition.last = this;
    }
    emit(results: { transcript: string; isFinal: boolean }[]) {
      const list = results.map((r) => Object.assign([{ transcript: r.transcript }], { isFinal: r.isFinal }));
      this.dispatchEvent(Object.assign(new Event("result"), { resultIndex: 0, results: list }));
    }
  }

  it("uses SpeechRecognition: toggles aria-pressed, shows interim text and emits final phrases", async () => {
    restores.push(stub(window, "SpeechRecognition", FakeRecognition));
    const user = userEvent.setup();
    const onText = vi.fn();
    const onListening = vi.fn();
    const { container } = render(<SpeechInput lang="en-GB" onTranscriptionChange={onText} onListeningChange={onListening} />);
    const button = screen.getByRole("button", { name: "Voice input" });
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(button).toHaveAttribute("aria-pressed", "false");

    await user.click(button);
    const rec = FakeRecognition.last!;
    expect(rec.start).toHaveBeenCalled();
    expect(rec.lang).toBe("en-GB");
    expect(rec.interimResults).toBe(true);
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(onListening).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole("status")).toHaveTextContent("Listening…");
    expect(button).toHaveAccessibleDescription("Listening…");

    act(() => rec.emit([{ transcript: "hello wor", isFinal: false }]));
    expect(screen.getByText("hello wor")).toBeInTheDocument();
    act(() => rec.emit([{ transcript: "hello world ", isFinal: true }]));
    expect(onText).toHaveBeenCalledWith("hello world");
    expect(screen.queryByText("hello wor")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();

    await user.click(button);
    expect(rec.stop).toHaveBeenCalled();
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(onListening).toHaveBeenLastCalledWith(false);
  });

  it("reports recognition errors in the status region", async () => {
    restores.push(stub(window, "SpeechRecognition", FakeRecognition));
    const user = userEvent.setup();
    render(<SpeechInput />);
    const button = screen.getByRole("button", { name: "Voice input" });
    await waitFor(() => expect(button).not.toBeDisabled());
    await user.click(button);
    act(() => {
      FakeRecognition.last!.dispatchEvent(Object.assign(new Event("error"), { error: "not-allowed" }));
      FakeRecognition.last!.dispatchEvent(new Event("end"));
    });
    expect(screen.getByRole("status")).toHaveTextContent("Microphone access is blocked.");
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("falls back to MediaRecorder and passes the returned transcript on", async () => {
    const track = { stop: vi.fn() };
    class FakeRecorder extends EventTarget {
      state: RecordingState = "inactive";
      mimeType = "audio/webm";
      start() {
        this.state = "recording";
      }
      stop() {
        this.state = "inactive";
        this.dispatchEvent(Object.assign(new Event("dataavailable"), { data: new Blob(["abc"], { type: "audio/webm" }) }));
        this.dispatchEvent(new Event("stop"));
      }
    }
    restores.push(
      stub(window, "MediaRecorder", FakeRecorder),
      stub(navigator, "mediaDevices", { getUserMedia: vi.fn(async () => ({ getTracks: () => [track] })) }),
    );
    let resolve!: (text: string) => void;
    const onAudioRecorded = vi.fn(() => new Promise<string>((r) => (resolve = r)));
    const onText = vi.fn();
    const user = userEvent.setup();
    render(<SpeechInput onAudioRecorded={onAudioRecorded} onTranscriptionChange={onText} />);
    const button = screen.getByRole("button", { name: "Voice input" });
    await waitFor(() => expect(button).not.toBeDisabled());

    await user.click(button);
    await waitFor(() => expect(button).toHaveAttribute("aria-pressed", "true"));
    await user.click(button);
    expect(onAudioRecorded).toHaveBeenCalledWith(expect.any(Blob));
    expect(track.stop).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Transcribing…"));
    expect(button).toHaveAttribute("aria-busy", "true");
    await act(async () => resolve(" server text "));
    expect(onText).toHaveBeenCalledWith("server text");
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it("is disabled with an explanation when speech can't be captured", async () => {
    const { container } = render(<SpeechInput />);
    const button = screen.getByRole("button", { name: "Voice input" });
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleDescription("Voice input isn't supported in this browser.");
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Transcription", () => {
  const segments: TranscriptSegment[] = [
    { text: "Hello there.", startSecond: 0, endSecond: 2 },
    { text: " ", startSecond: 2, endSecond: 3 },
    { text: "General update.", startSecond: 3, endSecond: 65, speaker: "Dana" },
    { text: "Bye.", startSecond: 65, endSecond: 70 },
  ];

  it("marks the active segment and seeks on click and Enter", async () => {
    const user = userEvent.setup();
    const onSeek = vi.fn();
    const { container } = render(<Transcription segments={segments} defaultCurrentTime={4} onSeek={onSeek} />);
    const region = screen.getByRole("region", { name: "Transcript" });
    const buttons = within(region).getAllByRole("button");
    expect(buttons).toHaveLength(3); // blank segment skipped
    expect(buttons[1]).toHaveAccessibleName("0:03 Dana General update.");
    expect(buttons[1]).toHaveAttribute("aria-current", "true");
    expect(buttons[0]).not.toHaveAttribute("aria-current");
    expect(await axe(container)).toHaveNoViolations();

    await user.click(buttons[2]!);
    expect(onSeek).toHaveBeenLastCalledWith(65);
    expect(buttons[2]).toHaveAttribute("aria-current", "true");

    buttons[0]!.focus();
    await user.keyboard("{Enter}");
    expect(onSeek).toHaveBeenLastCalledWith(0);
    expect(buttons[0]).toHaveAttribute("aria-current", "true");
  });

  it("follows a controlled time and renders plain text without onSeek", () => {
    const { rerender } = render(<Transcription segments={segments} currentTime={1} layout="inline" />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Hello there.").parentElement).toHaveAttribute("aria-current", "true");
    rerender(<Transcription segments={segments} currentTime={66} layout="inline" />);
    expect(screen.getByText("Bye.").parentElement).toHaveAttribute("aria-current", "true");
    expect(screen.getByText("Hello there.").parentElement).toHaveAttribute("data-past");
  });
});

describe("Sandbox", () => {
  it("names the header with its state, collapses and switches tabs with the keyboard", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Sandbox>
        <SandboxHeader title="main.py" state="error" summary="exit code 1" />
        <SandboxContent>
          <SandboxTabs defaultValue="code">
            <SandboxTabsList>
              <SandboxTab value="code">Code</SandboxTab>
              <SandboxTab value="output">Output</SandboxTab>
            </SandboxTabsList>
            <SandboxTabPanel value="code">
              <SandboxCode code="print(1/0)" language="python" />
            </SandboxTabPanel>
            <SandboxTabPanel value="output">
              <SandboxOutput errorText="ZeroDivisionError: division by zero" />
            </SandboxTabPanel>
          </SandboxTabs>
        </SandboxContent>
      </Sandbox>,
    );
    const header = screen.getByRole("button", { name: /main\.py\s*Error\s*exit code 1/ });
    expect(header).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("tabpanel", { name: "Code" })).toHaveTextContent("print(1/0)");
    expect(await axe(container)).toHaveNoViolations();

    const codeTab = screen.getByRole("tab", { name: "Code" });
    act(() => codeTab.focus());
    await user.keyboard("{ArrowRight}");
    await user.keyboard("{Enter}");
    await waitFor(() => expect(screen.getByRole("tab", { name: "Output" })).toHaveAttribute("aria-selected", "true"));
    expect(screen.getByRole("tabpanel", { name: "Output" })).toHaveTextContent("Error: ZeroDivisionError");

    await user.click(header);
    expect(header).toHaveAttribute("aria-expanded", "false");
  });
});

describe("WebPreview", () => {
  it("navigates from the address bar, walks history and reloads the frame", async () => {
    const user = userEvent.setup();
    const onUrlChange = vi.fn();
    const { container } = render(
      <WebPreview defaultUrl="https://one.example" onUrlChange={onUrlChange}>
        <WebPreviewNavigation>
          <WebPreviewBack />
          <WebPreviewForward />
          <WebPreviewReload />
          <WebPreviewUrl />
        </WebPreviewNavigation>
        <WebPreviewBody title="Generated app" />
        <WebPreviewConsole logs={[{ level: "warn", message: "Deprecated API" }, { level: "error", message: "Boom" }]} />
      </WebPreview>,
    );
    const frame = () => screen.getByTitle("Generated app");
    expect(frame()).toHaveAttribute("src", "https://one.example");
    expect(frame()).toHaveAttribute("sandbox", "allow-scripts allow-forms");
    expect(screen.getByRole("status")).toHaveTextContent("Loading preview");
    fireEvent.load(frame());
    expect(screen.queryByRole("status")).toBeNull();

    const nav = screen.getByRole("group", { name: "Preview navigation" });
    const back = within(nav).getByRole("button", { name: "Back" });
    const forward = within(nav).getByRole("button", { name: "Forward" });
    expect(back).toBeDisabled();
    expect(forward).toBeDisabled();
    expect(await axe(container, noFrames)).toHaveNoViolations();

    const address = within(nav).getByRole("textbox", { name: "Address" });
    await user.clear(address);
    await user.type(address, "two.example/page{Enter}");
    expect(onUrlChange).toHaveBeenLastCalledWith("https://two.example/page");
    expect(frame()).toHaveAttribute("src", "https://two.example/page");
    expect(back).not.toBeDisabled();

    await user.click(back);
    expect(frame()).toHaveAttribute("src", "https://one.example");
    expect(address).toHaveValue("https://one.example");
    expect(forward).not.toBeDisabled();
    await user.click(forward);
    expect(frame()).toHaveAttribute("src", "https://two.example/page");

    const before = frame();
    await user.click(within(nav).getByRole("button", { name: "Reload" }));
    expect(frame()).not.toBe(before);

    const consoleToggle = screen.getByRole("button", { name: /Console\s*1 error, 1 warning/ });
    expect(consoleToggle).toHaveAttribute("aria-expanded", "false");
    await user.click(consoleToggle);
    const output = await screen.findByRole("region", { name: "Console output" });
    expect(within(output).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["WarningDeprecated API", "ErrorBoom"]);
  });

  it("shows an empty state and normalizes addresses", () => {
    render(
      <WebPreview>
        <WebPreviewBody title="Preview" sandbox="allow-scripts" />
      </WebPreview>,
    );
    expect(screen.getByText("Enter an address to load the preview.")).toBeInTheDocument();
    expect(normalizeUrl("localhost:5173")).toBe("http://localhost:5173");
    expect(normalizeUrl("/preview")).toBe("/preview");
    expect(normalizeUrl("example.com:8080/a")).toBe("https://example.com:8080/a");
    expect(normalizeUrl("javascript:alert(1)")).toBe("");
    expect(normalizeUrl(" https://x.dev ")).toBe("https://x.dev");
  });
});
